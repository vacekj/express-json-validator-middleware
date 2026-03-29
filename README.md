# Express JSON Validator Middleware

> Express middleware for validating requests against JSON schemas with Ajv.

[![npm version](https://img.shields.io/npm/v/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm monthly downloads](https://img.shields.io/npm/dm/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm license](https://img.shields.io/npm/l/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![CI](https://github.com/vacekj/express-json-validator-middleware/actions/workflows/ci.yml/badge.svg)](https://github.com/vacekj/express-json-validator-middleware/actions/workflows/ci.yml)

## Why validate with JSON schemas?

- **Expressive**: JSON Schema is a portable way to describe data structures.
- **Separate validation**: Route handlers can focus on business logic.
- **Rich errors**: Ajv provides detailed error objects you can return or transform.
- **Flexible**: You can validate `body`, `params`, `query`, or custom request properties.

## Requirements

- Node.js 24 or newer. Node 24 is the latest LTS line as of March 28, 2026.
- Express 4.21.2+ or 5.2.1+.

## Installation

Install with npm:

```sh
npm install express express-json-validator-middleware
```

Install with Bun:

```sh
bun add express express-json-validator-middleware
```

Upgrading from v3? Read the [v3 to v4 upgrade guide](./docs/migrating-from-v3-to-v4.md).

## Getting started

```js
import express from "express";
import { Validator } from "express-json-validator-middleware";

const app = express();

app.use(express.json());

const addressSchema = {
	type: "object",
	required: ["street"],
	properties: {
		street: {
			type: "string"
		}
	}
};

const { validate } = new Validator({ allErrors: true });

app.post("/address", validate({ body: addressSchema }), (request, response) => {
	response.json({ street: request.body.street });
});
```

Coming from `express-jsonschema`? Read the [migration notes](./docs/migrating-from-express-jsonschema.md).

## Schemas in TypeScript

When authoring schemas in TypeScript, combine this package's `AllowedSchema` type with Ajv's `JSONSchemaType` helper:

```ts
import type { JSONSchemaType } from "ajv";
import { type AllowedSchema } from "express-json-validator-middleware";

type Address = {
	street: string;
};

const addressSchema: AllowedSchema & JSONSchemaType<Address> = {
	type: "object",
	required: ["street"],
	properties: {
		street: {
			type: "string"
		}
	}
};
```

## Error handling

Validation failures are forwarded to Express with a `ValidationError`:

```js
import express from "express";
import { ValidationError } from "express-json-validator-middleware";

const app = express();

app.use((error, request, response, next) => {
	if (error instanceof ValidationError) {
		response.status(400).json({
			name: error.name,
			validationErrors: error.validationErrors
		});
		return;
	}

	next(error);
});
```

Example error payload:

```js
{
	name: "JsonSchemaValidationError",
	validationErrors: {
		body: [
			{
				instancePath: "/name",
				keyword: "type"
			}
		]
	}
}
```

## Validating multiple request properties

```js
const tokenSchema = {
	type: "object",
	required: ["token"],
	properties: {
		token: {
			type: "string",
			minLength: 36,
			maxLength: 36
		}
	}
};

const paramsSchema = {
	type: "object",
	required: ["uuid"],
	properties: {
		uuid: {
			type: "string",
			minLength: 36,
			maxLength: 36
		}
	}
};

app.post(
	"/address/:uuid",
	validate({
		body: addressSchema,
		params: paramsSchema,
		query: tokenSchema
	}),
	(request, response) => {
		response.send({});
	}
);
```

## Using dynamic schemas

Instead of passing a schema object, you can pass a function that derives a schema from the current request:

```js
function getSchema(request) {
	if (request.query.requireAge === "1") {
		return {
			type: "object",
			required: ["name", "age"],
			properties: {
				name: { type: "string" },
				age: { type: "number" }
			}
		};
	}

	return {
		type: "object",
		required: ["name"],
		properties: {
			name: { type: "string" }
		}
	};
}

app.post("/user", validate({ body: getSchema }), (request, response) => {
	response.json({ success: true });
});
```

## Ajv instance

The underlying Ajv instance is available as `validator.ajv` and should be configured before you create middleware with `validate()`:

```js
import { Validator } from "express-json-validator-middleware";

const validator = new Validator({ allErrors: true });

validator.ajv;
```

If you use schema formats, remember to install and register [`ajv-formats`](https://www.npmjs.com/package/ajv-formats).

## Development

This repository now uses Bun for dependency management:

```sh
bun install
```

Run the full verification suite with either package manager:

```sh
bun run verify
npm run verify
```

`npm run verify` and `bun run verify` cover:

- Node runtime tests
- type-checking against the published API
- coverage generation
- packaging the library with `npm pack`
- installing the packed tarball into `/tmp/sample-express-app/npm`
- installing the packed tarball into `/tmp/sample-express-app/bun`

## Tests

```sh
npm test
npm run test:types
npm run test:install:npm
npm run test:install:bun
```

## More documentation on JSON Schema

- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/index.html)

## Credits

- Maintained by [@simonplend](https://github.com/simonplend/)
- Created and previously maintained by [@vacekj](https://github.com/vacekj/)
- Thank you to all of this project's [contributors](https://github.com/vacekj/express-json-validator-middleware/graphs/contributors)
- Based on the [express-json-schema](https://github.com/trainiac/express-jsonschema) library by [@trainiac](https://github.com/trainiac)
