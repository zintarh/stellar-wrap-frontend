import { NextRequest } from 'next/server';
import { GET as getData } from '../data/[wallet]/route';
import { GET as getPreferences, PUT as putPreferences } from '../preferences/[wallet]/route';
import { POST as subscribe } from '../subscribe/route';
import { POST as subscribeEmail } from '../subscribe-email/route';
import { GET as confirmEmail } from '../confirm-email/route';
import { GET as unsubscribe } from '../unsubscribe/route';
import { POST as dispatch } from '../dispatch/route';

const VALID_WALLET = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF5';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

function jsonRequest(url: string, body: unknown, init?: RequestInit): NextRequest {
  return makeRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });
}

describe('notification record authentication', () => {
  describe('GET /api/notifications/data/[wallet]', () => {
    it('rejects an unauthenticated request', async () => {
      const req = makeRequest(
        `http://localhost/api/notifications/data/${VALID_WALLET}`,
      );
      const res = await getData(req, { params: { wallet: VALID_WALLET } });
      expect(res.status).toBe(401);
    });

    it('rejects a request with an invalid signature', async () => {
      const req = makeRequest(
        `http://localhost/api/notifications/data/${VALID_WALLET}`,
        {
          headers: {
            'x-stellar-address': VALID_WALLET,
            'x-stellar-signature': 'not-a-valid-signature',
            'x-stellar-message': 'challenge',
          },
        },
      );
      const res = await getData(req, { params: { wallet: VALID_WALLET } });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/preferences/[wallet]', () => {
    it('rejects an unauthenticated request', async () => {
      const req = makeRequest(
        `http://localhost/api/notifications/preferences/${VALID_WALLET}`,
      );
      const res = await getPreferences(req, { params: { wallet: VALID_WALLET } });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/preferences/[wallet]', () => {
    it('rejects an unauthenticated request', async () => {
      const req = makeRequest(
        `http://localhost/api/notifications/preferences/${VALID_WALLET}`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'attacker@example.com' }),
        },
      );
      const res = await putPreferences(req, { params: { wallet: VALID_WALLET } });
      expect(res.status).toBe(401);
    });

    it('rejects a request with an invalid signature', async () => {
      const req = makeRequest(
        `http://localhost/api/notifications/preferences/${VALID_WALLET}`,
        {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            'x-stellar-address': VALID_WALLET,
            'x-stellar-signature': 'not-a-valid-signature',
            'x-stellar-message': 'challenge',
          },
          body: JSON.stringify({ email: 'attacker@example.com' }),
        },
      );
      const res = await putPreferences(req, { params: { wallet: VALID_WALLET } });
      expect(res.status).toBe(401);
    });
  });
});

describe('POST /api/notifications/subscribe', () => {
  it('rejects an invalid body', async () => {
    const req = jsonRequest('http://localhost/api/notifications/subscribe', {});
    const res = await subscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects a malformed wallet address', async () => {
    const req = jsonRequest('http://localhost/api/notifications/subscribe', {
      wallet: 'not-a-wallet',
      email: 'user@example.com',
    });
    const res = await subscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('POST /api/notifications/subscribe-email', () => {
  it('rejects an invalid body', async () => {
    const req = jsonRequest(
      'http://localhost/api/notifications/subscribe-email',
      {},
    );
    const res = await subscribeEmail(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects a malformed email address', async () => {
    const req = jsonRequest(
      'http://localhost/api/notifications/subscribe-email',
      { email: 'not-an-email' },
    );
    const res = await subscribeEmail(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/notifications/confirm-email', () => {
  it('rejects a request without a token', async () => {
    const req = makeRequest('http://localhost/api/notifications/confirm-email');
    const res = await confirmEmail(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects an invalid confirmation token', async () => {
    const req = makeRequest(
      'http://localhost/api/notifications/confirm-email?token=invalid-token',
    );
    const res = await confirmEmail(req);
    expect([400, 404]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/notifications/unsubscribe', () => {
  it('rejects a request without a token', async () => {
    const req = makeRequest('http://localhost/api/notifications/unsubscribe');
    const res = await unsubscribe(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects an invalid unsubscribe token', async () => {
    const req = makeRequest(
      'http://localhost/api/notifications/unsubscribe?token=invalid-token',
    );
    const res = await unsubscribe(req);
    expect([400, 404]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('POST /api/notifications/dispatch', () => {
  it('rejects an unauthenticated request', async () => {
    const req = jsonRequest('http://localhost/api/notifications/dispatch', {
      event: 'test',
    });
    const res = await dispatch(req);
    expect([401, 403]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects an invalid body', async () => {
    const req = jsonRequest('http://localhost/api/notifications/dispatch', {});
    const res = await dispatch(req);
    expect([400, 401, 403]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
