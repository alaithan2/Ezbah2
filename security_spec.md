# Al Ezbah Security Specification

## Data Invariants
1. A user can only belong to one family.
2. An expense must belong to a family.
3. Access to family sub-collections (expenses, merchants, wallets) is strictly derived from membership in the root family document.
4. Timestamps (`createdAt`, `updatedAt`, `date`) must use `request.time`.
5. Amounts must be positive numbers.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create an expense for a family the user doesn't belong to.
2. **Ghost Mapping**: Attempt to add a field `isVerified: true` to a user profile.
3. **Budget Hijack**: Attempt to change another family's monthly budget.
4. **Negative Expense**: Attempt to record an amount of -500.
5. **ID Poisoning**: Inject a 2KB string as a merchant ID.
6. **Self-Promotion**: Authenticated user attempts to add themselves to the `admins` collection.
7. **Future Date Injection**: Attempt to set a `date` in the year 2099.
8. **Shadow Field Injection**: Attempt to add `role: 'admin'` to a wallet document.
9. **Relational Sync Break**: Attempt to create an expense referencing a non-existent merchant.
10. **Terminal State Reversion**: Attempt to "re-open" a completed shopping item without permission.
11. **Client Timestamp Spoofing**: Provide a manual string for `createdAt`.
12. **Orphaned Write**: Create a shopping item without a `familyId`.

## Test Runner (Draft)
Available in `src/tests/firestore.rules.test.ts`.
