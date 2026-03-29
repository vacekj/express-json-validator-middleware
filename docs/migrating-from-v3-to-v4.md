# Migrating from v3 to v4

Version 4 keeps the core middleware API intact, but it raises the platform floor and modernizes packaging, testing, and install verification.

## What changed

- Node.js 24+ is now required. Node 24 is the latest LTS line as of March 28, 2026.
- The repository now uses Bun for dependency management and local development.
- The package now publishes an explicit `exports` map for the package root.
- Ajv has been refreshed to the latest v8 release line.
- TypeScript definitions were updated and now:
	- allow `new Validator()` with no constructor arguments
	- support custom request-property keys in `validate({ ... })`
	- are covered by dedicated public API type tests
- CI now checks Node tests, type tests, coverage output, and sample-app installation with both npm and Bun.

## Required changes for consumers

### 1. Upgrade Node.js

If your app is running on Node 14, 16, 18, 20, 22, or 23, upgrade to Node 24 or newer before moving to v4.

### 2. Keep installing Express separately

This package still expects your app to provide Express:

```sh
npm install express express-json-validator-middleware
```

or

```sh
bun add express express-json-validator-middleware
```

### 3. Stop using deep imports

v4 publishes an explicit package entrypoint. Import from the package root:

```js
import { Validator, ValidationError } from "express-json-validator-middleware";
```

Avoid imports such as:

```js
import { Validator } from "express-json-validator-middleware/src/index.js";
```

## Ajv notes

This package continues to use Ajv v8. If you rely on formats, keep using [`ajv-formats`](https://www.npmjs.com/package/ajv-formats).

## Verification steps

For applications upgrading from v3, a good smoke-test flow is:

```sh
npm install
npm test
```

Then confirm one real route in your app still:

- rejects invalid `body`, `params`, and `query` payloads with `ValidationError`
- accepts valid payloads
- still applies any custom Ajv configuration before `validate()` is called

## Repository contributors

If you work on this repository itself, the new maintainer workflow is:

```sh
bun install
bun run verify
```
