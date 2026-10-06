# Transaction History

This is the single current document describing the transaction-history feature.
It consolidates the former root-level `TRANSACTION_HISTORY_DELIVERY.md`,
`TRANSACTION_HISTORY_DOCUMENTATION.md`, and
`TRANSACTION_HISTORY_IMPLEMENTATION.md`, which are now superseded.

## Overview

The transaction-history feature lets a user browse the transactions associated
with their account. It is backed by the recent-ledgers data layer and rendered
through the transaction-history UI.

## Data layer

- Recent ledgers are fetched with the `useRecentLedgers` hook, which wraps the
  React Query cache and exposes loading, error, and data states to consumers.
- The hook is the single source of truth for ledger data; UI components should
  consume it rather than fetching ledgers directly.
- Query keys and cache invalidation live alongside the hook so that refetches
  stay consistent across the app.

## UI

- The transaction-history view renders the ledgers returned by
  `useRecentLedgers`, handling the loading and empty states.
- Each entry links to its transaction detail where applicable.

## Delivery notes

The feature has been merged. The per-delivery documents that tracked its
implementation (`TRANSACTION_HISTORY_DELIVERY.md`,
`TRANSACTION_HISTORY_DOCUMENTATION.md`,
`TRANSACTION_HISTORY_IMPLEMENTATION.md`) have been consolidated into this file
and removed from the repository root.

## See also

- [Documentation index](./README.md)
- [Testing](./TESTING.md)
