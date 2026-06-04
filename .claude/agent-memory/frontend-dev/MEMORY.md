# Frontend Dev Agent Memory

## ESLint patterns in this codebase

- **`catch (err: any)`** is the most common lint issue. Replace with `catch (err: unknown)` and use `err instanceof Error ? err.message : 'fallback'`.
- **`as any` for select onChange** -- use explicit union type like `as 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN'`.
- **useEffect missing deps** -- wrap the missing function in `useCallback` with proper deps, then include it in the effect's dep array.
- **`<img>` tags** -- replace with `<Image unoptimized ...>` from `next/image`. For fill mode, parent needs `relative` + fixed height.
- **Non-null assertions (`!`)** -- replace with nullish coalescing (`??`) or optional chaining (`?.`).
- **Generated files** (prisma, `out/`) must be excluded in eslint config. In flat config, the ignores block must come FIRST in the array and use glob patterns like `**/out/**/*` and `**/generated/**/*`.

## Key type references

- Auth user type: `CognitoUser` from `lib/cognito.ts` -- has `username`, `email`, `accessToken`, `role?`, `displayName?`, `sub?`, `cognitoUid?`
- `WineryFilters` from `types/winery.ts` -- fields are `search: string`, `region: string`, `wineType: string`, `sustainable: boolean`, `featured: boolean`
