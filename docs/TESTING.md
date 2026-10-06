# Testing

This is the single current testing document for the project. It replaces the
former root-level `TESTING.md` and `TESTING_STRATEGY.md`, which described the
same testing approach in two overlapping files.

## Goals

- Catch regressions before they reach `main`.
- Keep tests fast enough to run on every change.
- Cover the critical paths: ledger ingestion, transaction history, and the
  simulation flow.

## Test layers

### Unit tests

Small, fast, and isolated. They cover pure logic such as formatting helpers,
parsers, and reducers. Prefer these whenever the behavior can be exercised
without a network or a database.

### Integration tests

Exercise modules together against a test database or mocked services. Use these
for data access, query hooks, and anything that crosses a module boundary.

### End-to-end tests

Drive the application the way a user would. Keep the suite small and focused on
flows that must never break, such as loading recent ledgers and viewing a
transaction's history.

## Running the tests

```sh
# all tests
npm test

# a single file
npm test -- path/to/file.test.ts

# watch mode during development
npm test -- --watch
```

## Conventions

- Place tests next to the code they cover, using the `*.test.ts` suffix.
- Name tests after the behavior under test, not the implementation.
- Avoid snapshot tests for anything that changes often.
- Mock external services at the boundary; do not reach into their internals.
- Keep each test independent — no shared mutable state between cases.

## What to test

- New behavior: add a test that fails without the change.
- Bug fixes: add a regression test that reproduces the original bug.
- Refactors: rely on existing tests; add coverage only for newly exposed paths.

## Continuous integration

The full suite runs on every pull request. A change is not ready to merge until
the suite passes. Flaky tests should be fixed or removed rather than retried
indefinitely.
