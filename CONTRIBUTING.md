# Contributing to Stellar Wrap

## Account Recovery architecture

Account Recovery lets a user regain access to their Stellar Wrap account
when they lose their primary signer. The flow is intentionally small and
lives in a few decoupled modules so it can be reused and tested in
isolation.

### How it works

1. **Initiation** — the user starts recovery from the account settings
   screen. The UI collects the recovery method (e.g. a backup signer or a
   recovery phrase) and hands it to the recovery service.
2. **Verification** — the recovery service validates the provided proof
   against the account's registered recovery configuration. No state is
   mutated until verification succeeds.
3. **Signer rotation** — on success, the service builds and submits the
   transaction that rotates the account signer to the new key.
4. **Confirmation** — the UI reflects the updated signer and clears any
   transient recovery state.

### Key modules

- **Recovery service** — owns the verification and signer-rotation
  logic. It is framework-agnostic and has no UI dependencies.
- **Recovery state** — the small store/hook that tracks the in-progress
  recovery (method, status, errors) for the UI.
- **Recovery UI** — the components that render the flow. They only read
  from and dispatch to the service/state; they contain no recovery
  business logic.

### Maintaining it

- **Extending** — add new recovery methods in the service layer first,
  then surface them through the state hook and UI. Keep the service free
  of UI imports so it stays reusable.
- **Testing** — cover the service's verification and rotation paths with
  unit tests, and the UI flow with component tests. Recovery is
  security-sensitive, so test both the success and failure branches.
- **Types** — keep recovery types strict; `any` is not allowed. Share
  types between the service and UI rather than re-declaring them.
- **Health** — when changing the recovery configuration shape, update
  the service, the state hook, and the docs here together so they never
  drift.

## Handling dependency advisory exceptions

Our CI runs `pnpm audit` on every PR that touches `package.json` or
`pnpm-lock.yaml`, plus a weekly scheduled scan.

If an advisory has no available fix (no patched version exists) and a
maintainer has assessed it as not exploitable in our usage, it can be
suppressed via `pnpm.auditConfig.ignoreCves` in `package.json`:

```json
{
  "pnpm": {
    "auditConfig": {
      "ignoreCves": ["CVE-2024-XXXXX"]
    }
  }
}
```

Before adding an entry:
1. Confirm no patched version is available (`pnpm audit` will say so).
2. Document *why* it's safe to ignore in the PR description that adds the
   exception (e.g. "only affects a build-time-only dependency, never
   shipped to production").
3. Revisit ignored CVEs periodically — remove the entry once a fix ships.

Note: this project pins `pnpm@10.25.0`. If upgraded to pnpm v11+, this
field is renamed to `pnpm.auditConfig.ignoreGhsas` and uses GitHub
Advisory IDs (GHSA-xxxx-xxxx-xxxx) instead of CVE numbers.
