# API client toolchain — compatibility proof

**Phase 0.0 gate · verified 2026-07-31 · result: PASS**

The backend plan generates this app's HTTP client from the OpenAPI contract rather than hand-writing it.
That only works if the generator and its output survive this repo's toolchain, which is unusually current:
**TypeScript ~6.0.3**, React 19.2.3, React Native 0.86, Expo 57.

This gate ran **before** any migration work, because a failure here invalidates the whole client plan and
the fallback (hand-written client + hand-maintained types) is a materially different amount of work.

## Result

| Check | Outcome |
|---|---|
| `openapi-typescript` generates from a 3.1 spec | ✅ 7.13.0, 346 lines from a representative spec in ~35 ms |
| Generated `schema.d.ts` compiles under TS 6.0.3 `strict` | ✅ zero errors |
| `openapi-fetch` client usage compiles under TS 6.0.3 `strict` | ✅ zero errors, 0.17.0 |
| Type system actually **catches** contract violations | ✅ 8/8 negative cases, one error each |
| Installs without `--legacy-peer-deps` | ✅ with an `overrides` entry — see below |

## The one real finding

`openapi-typescript@7.13.0` declares `"peerDependencies": { "typescript": "^5.x" }`. This repo is on
TypeScript 6, so a plain `npm install` fails with `ERESOLVE`.

The range is **stale, not accurate** — TypeScript 6 is released and 7.0.2 is `latest`. `openapi-typescript`
is a build-time generator: it uses TypeScript to *emit* `.d.ts`, and the emitted output is plain type
declarations that any modern compiler reads. `openapi-fetch` declares no TypeScript peer at all.

Both were verified empirically rather than assumed.

### Fix — `overrides`, not `--legacy-peer-deps`

```jsonc
// package.json
{
  "devDependencies": {
    "typescript": "~6.0.3",
    "openapi-typescript": "^7.13.0"
  },
  "dependencies": {
    "openapi-fetch": "^0.17.0"
  },
  "overrides": {
    "openapi-typescript": { "typescript": "$typescript" }
  }
}
```

`$typescript` resolves to the root devDependency. Verified: clean `npm install`, successful generation, and
a clean `tsc --noEmit` over the generated output.

`--legacy-peer-deps` was rejected — it is a global flag that disables peer resolution for *every* package in
the tree, which on an Expo project is exactly the check you want left on.

## What was tested

A spec shaped like the real API, not a toy — English `PascalCase` enums, `oneOf` + `discriminator` message
unions, cursor pagination envelopes, RFC 9457 problem documents with a stable `code`, nullable fields via
`type: ["string","null"]`, `date`/`date-time`/`uuid` formats, money as a decimal **string**, and required
`Idempotency-Key` / `If-Match` headers.

The negative suite confirms the types are load-bearing rather than degrading to `any`:

| # | Violation | Caught |
|---|---|---|
| 1 | Turkish literal `'aktif'` where the wire enum is `'Active'` | TS2322 |
| 2 | Sort value outside the closed enum | TS2322 |
| 3 | Missing required `Idempotency-Key` header | TS2345 |
| 4 | Missing required body field | TS2322 |
| 5 | `weeks: 3` against a `1 \| 2 \| 4 \| 8` union | TS2322 |
| 6 | Reading `.body` off the `Image` arm of a discriminated union | TS2339 |
| 7 | Nullable `sessionsRemaining` assigned to `number` | TS2322 |
| 8 | Typo'd path `/api/v1/member` | TS2345 |

Case 1 matters most: it is the exact mistake the English-enum migration invites, and the compiler rejects it.

## Consequences

- The plan's contract-first approach is viable as designed. No fallback needed.
- `npm run api:sync && api:generate && tsc --noEmit` becomes a CI job once the backend publishes a contract.
- Re-run this gate when TypeScript 7 is adopted, or when `openapi-typescript` majors.
