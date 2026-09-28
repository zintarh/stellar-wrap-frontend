/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MultiSig } from '../MultiSig';
import { useMultiSigStore } from '../../store/multiSigStore';
import { useMultiSigWallet } from '../../hooks/useMultiSigWallet';

jest.mock('../../hooks/useMultiSigWallet', () => ({
  useMultiSigWallet: jest.fn(),
}));

jest.mock('@stellar/freighter-api', () => ({
  signTransaction: jest.fn(),
  isConnected: jest.fn(),
  getAddress: jest.fn(),
  getNetworkDetails: jest.fn(),
  requestAccess: jest.fn(),
}));

jest.mock('stellar-sdk', () => {
  const actual = jest.requireActual('stellar-sdk');
  class MockContract {
    call(_method: string, ..._args: unknown[]) { return 'mockOp'; }
  }
  class MockTransaction {
    toXDR() { return 'base64mockxdr=='; }
  }
  class MockTransactionBuilder {
    constructor(_account: unknown, _opts: unknown) {}
    addOperation() { return this; }
    setTimeout() { return this; }
    build() { return new MockTransaction(); }
  }
  class MockScVal {}
  return {
    ...actual,
    Contract: MockContract,
    Transaction: MockTransaction,
    TransactionBuilder: MockTransactionBuilder,
    BASE_FEE: '100',
    Horizon: {
      Server: jest.fn().mockImplementation(() => ({
        loadAccount: jest.fn().mockResolvedValue({ balances: [] }),
      })),
    },
    xdr: {
      ...actual.xdr,
      ScVal: MockScVal,
    },
  };
});

jest.mock('stellar-sdk/rpc', () => ({
  Server: jest.fn().mockImplementation(() => ({})),
  Api: { GetTransactionStatus: { SUCCESS: 'SUCCESS', FAILED: 'FAILED', NOT_FOUND: 'NOT_FOUND' } },
}));

// config/contracts.ts imports the scoped SDK entry point directly.
jest.mock('@stellar/stellar-sdk', () => ({
  StrKey: { isValidEd25519PublicKey: () => true },
}));

const PROPOSER = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
const COSIGNER = 'GBVZKEY27JCGO5VJKFNJ5LFFAJRNPZ5BGKJZGFBOPNV65AJVZFQBSYP';

function baseHookReturn(displayState: {
  phase: string;
  totalSigners: number;
  signedCount: number;
  threshold: number;
  thresholdMet: boolean;
  isExpired: boolean;
}) {
  return {
    walletAddress: PROPOSER,
    isWalletConnected: true,
    isConnecting: false,
    connectWallet: jest.fn(),
    txState: 'signed',
    isLoading: false,
    lastError: null,
    errorMessage: null,
    displayState,
    canSign: true,
    propose: jest.fn(),
    sign: jest.fn(),
    execute: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };
}

function seedStore(signers: Array<{ publicKey: string; hasSigned: boolean }>, threshold: number) {
  const now = new Date().toISOString();
  useMultiSigStore.setState({
    currentProposal: {
      id: 'msig-cta-test',
      network: 'testnet',
      contractAddress: 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE',
      contractArgs: { method: 'mint_wrap', params: {} },
      unsignedXdr: 'base64mockxdr==',
      assembledXdr: 'base64mockxdr==',
      signers: signers.map((s) => ({
        ...s,
        signedAt: s.hasSigned ? now : null,
      })),
      threshold,
      proposedBy: PROPOSER,
      proposedAt: now,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      simulationResult: { success: true },
      state: 'proposed',
      transactionHash: null,
      confirmedLedger: null,
    } as never,
    txState: 'signed',
    lastError: null,
    transactionHash: null,
    isLoading: false,
  });
}

describe('MultiSig execute CTA gating (issue #638)', () => {
  beforeEach(() => {
    useMultiSigStore.setState({
      currentProposal: null,
      txState: 'idle',
      lastError: null,
      transactionHash: null,
      confirmedLedger: null,
      isLoading: false,
      confirmingAttempt: null,
      connectedWalletAddress: null,
    });
    jest.clearAllMocks();
  });

  it('hides the Execute button while below threshold', () => {
    seedStore(
      [
        { publicKey: PROPOSER, hasSigned: true },
        { publicKey: COSIGNER, hasSigned: false },
      ],
      2,
    );
    (useMultiSigWallet as jest.Mock).mockReturnValue(
      baseHookReturn({
        phase: 'sign',
        totalSigners: 2,
        signedCount: 1,
        threshold: 2,
        thresholdMet: false,
        isExpired: false,
      }),
    );

    render(<MultiSig />);
    expect(
      screen.queryByRole('button', { name: /execute transaction/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the Execute button once the threshold is met', () => {
    seedStore(
      [
        { publicKey: PROPOSER, hasSigned: true },
        { publicKey: COSIGNER, hasSigned: true },
      ],
      2,
    );
    (useMultiSigWallet as jest.Mock).mockReturnValue(
      baseHookReturn({
        phase: 'execute',
        totalSigners: 2,
        signedCount: 2,
        threshold: 2,
        thresholdMet: true,
        isExpired: false,
      }),
    );

    render(<MultiSig />);
    expect(
      screen.getByRole('button', { name: /execute transaction/i }),
    ).toBeInTheDocument();
  });
});
