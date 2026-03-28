# Express JSON Validator Middleware

> [Express](https://github.com/expressjs/express/) middleware for validating
requests against JSON schemas with Ajv.

[![npm version](https://img.shields.io/npm/v/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm monthly downloads](https://img.shields.io/npm/dm/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm license](https://img.shields.io/npm/l/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![Build status](https://github.com/vacekj/express-json-validator-middleware/workflows/Node.js%20CI/badge.svg)](https://github.com/vacekj/express-json-validator-middleware/actions?query=workflow%3A%22Node.js+CI%22)
[![codecov](https://codecov.io/gh/vacekj/express-json-validator-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/vacekj/express-json-validator-middleware)

## Why validate with JSON schemas?

- **Expressive** — JSON schemas are an expressive way to describe data structures.
- **Standard** — JSON schemas are portable. There are validator implementations in many languages.
- **Separate validation** — Avoid the need to handle request validation in your route handlers.
- **Error messaging** — Ajv provides rich and descriptive error objects.
- **Documentation** — Schemas can help document your application.

## Requirements

- [Node.js](https://nodejs.org/en/download/) >= v14

## Installation

```sh
npm install express-json-validator-middleware
```

If you're upgrading from v2 to v3, make sure you read the [migration notes](#upgrading-from-v2-to-v3).

## Getting started

```javascript
import { Validator } from "express-json-validator-middleware";

/**
 * Define a JSON schema.
 */
const addressSchema = {
  type: "object",
  required: ["street"],
  properties: {
    street: {
      type: "string",
    }
  },
};

/**
 * Initialize a `Validator` instance, optionally passing in
 * an Ajv options object.
 *
 * @see https://ajv.js.org/options.html
 */
const validator = new Validator();
const { validate } = validator;

/**
 * The `validate` method accepts an object which maps request
 * properties to the JSON schema you want them to be validated
 * against e.g.
 *
 * { requestPropertyToValidate: jsonSchemaObject }
 *
 * Validate `request.body` against `addressSchema`.
 */
app.post("/address", validate({ body: addressSchema }), (request, response) => {
  /**
   * Route handler logic to run when `request.body` has been validated.
   */
  response.send({});
});
```

If you need to add formats, plugins, or custom keywords to Ajv, create a
`Validator` instance first, configure `validator.ajv`, and only then call
`validate()`. See [Ajv instance](#ajv-instance).

Coming from `express-jsonschema`? Read the [migration notes](docs/migrating-from-express-jsonschema.md).

### Schemas in TypeScript

If you're writing JSON schemas in TypeScript, you'll need to use the
`AllowedSchema` type and this can be combined with [ajv's recommended `JSONSchemaType` type](https://ajv.js.org/guide/typescript.html) e.g.

```typescript
import { JSONSchemaType } from "ajv";
import { AllowedSchema } from "express-json-validator-middleware";

type Address = { street: string; };
const addressSchema: AllowedSchema & JSONSchemaType<Address> = {
  type: "object",
  required: ["street"],
  properties: {
    street: {
      type: "string",
    }
  },
};
```

This is required so TypeScript doesn't attempt to widen the types of values
in the schema object. If you omit this type, TypeScript will raise an error.

See issues [#39](https://github.com/simonplend/express-json-validator-middleware/issues/39)
and [#102](https://github.com/simonplend/express-json-validator-middleware/issues/102)
for more background.

## Error handling

On encountering invalid data, the validator will call `next()` with a
`ValidationError` object. It is recommended to setup a general error handler
for your app where you handle `ValidationError` errors.

Example - error thrown for the `body` request property:

```javascript
ValidationError {
    name: "JsonSchemaValidationError",
    validationErrors: {
        body: [AjvError]
    }
}
```

More information on [Ajv errors](https://github.com/ajv-validator/ajv/tree/v6#validation-errors).

## Example Express application

```javascript
import express from "express";

import { Validator, ValidationError } from "express-json-validator-middleware";

const app = express();

app.use(express.json());

const addressSchema = {
  type: "object",
  required: ["number", "street", "type"],
  properties: {
    number: {
      type: "number",
    },
    street: {
      type: "string",
    },
    type: {
      type: "string",
      enum: ["Street", "Avenue", "Boulevard"],
    },
  },
};

const validator = new Validator();
const { validate } = validator;

/**
 * Validate `request.body` against `addressSchema`.
 */
app.post("/address", validate({ body: addressSchema }), (request, response) => {
  /**
   * Route handler logic to run when `request.body` has been validated.
   */
  response.send({});
});

/**
 * Error handler middleware for validation errors.
 */
app.use((error, request, response, next) => {
  // Check the error is a validation error
  if (error instanceof ValidationError) {
    // Handle the error
    response.status(400).send(error.validationErrors);
    next();
  } else {
    // Pass error on if not a validation error
    next(error);
  }
});

app.listen(3000);
```

## Validating multiple request properties

Sometimes your route may depend on the `body` and `query` both having a specific
format. In this example we use `body` and `query` but you can choose to validate
any `request` properties you like. This example builds on the
[Example Express application](#example-express-application).

```javascript
const tokenSchema = {
  type: "object",
  required: ["token"],
  properties: {
    token: {
      type: "string",
      minLength: 36,
      maxLength: 36
    },
  },
};

app.post(
  "/address",
  validate({ body: addressSchema, query: tokenSchema }),
  (request, response) => {
    /**
     * Route handler logic to run when `request.body` and
     * `request.query` have both been validated.
     */
    response.send({});
  }
);
```

A valid request must now include a token URL query. Example valid URL:
`/street/?token=af3996d0-0e8b-4165-ae97-fdc0823be417`

The same kind of validation can also be performed on path parameters. Repurposing our earlier example,
we could expect the client to send us the UUID.

```javascript
const pathSchema = {
  type: "object",
  required: ["uuid"],
  properties: {
    uuid: {
      type: "string",
      minLength: 36,
      maxLength: 36
    },
  },
};

app.get(
  "/address/:uuid",
  validate({ body: addressSchema, params: pathSchema }),
  (request, response) => {
    /**
     * Route handler logic to run when `request.body` and
     * `request.params` have both been validated.
     */
    response.send({});
  }
);
```

## Using dynamic schema

Instead of passing in a schema object you can also pass in a function that will
return a schema. It is useful if you need to generate or alter the schema based
on the request object.

Example: Loading schema from a database (this example builds on the
[Example Express application](#example-express-application)):

```javascript
function getSchemaFromDb() {
  /**
   * In a real application this would be making a database query.
   */
  return Promise.resolve(addressSchema);
}

/**
 * Middleware to set schema on the `request` object.
 */
async function loadSchema(request, response, next) {
  try {
    request.schema = await getSchemaFromDb();
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Get schema set by the `loadSchema` middleware.
 */
function getSchema(request) {
  return request.schema;
}

app.post(
  "/address",
  loadSchema,
  validate({ body: getSchema }),
  (request, response) => {
    /**
     * Route handler logic to run when `request.body` has been validated.
     */
    response.send({});
  }
);
```

## Ajv instance

Each `Validator` instance exposes the underlying Ajv instance as
`validator.ajv`.

This is useful if you need to:

- add formats with [`ajv-formats`](https://www.npmjs.com/package/ajv-formats)
- register Ajv plugins
- define [custom keywords](https://ajv.js.org/guide/user-keywords.html)

Important: `validate()` compiles the schemas you pass to it when the middleware
is created. Configure `validator.ajv` before you call `validate()` or add the
middleware to a route.

For example, if your schema uses the `email` format, register
`ajv-formats` first and then create the middleware:

```javascript
import { Validator } from "express-json-validator-middleware";
import addFormats from "ajv-formats";

const validator = new Validator({ allErrors: true });

addFormats(validator.ajv);

const userSchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: {
      type: "string",
      format: "email",
    },
  },
};

const { validate } = validator;

app.post("/user", validate({ body: userSchema }), (request, response) => {
  response.send({});
});
```

Plugins and custom keywords follow the same pattern:

```javascript
someAjvPlugin(validator.ajv);

validator.ajv.addKeyword({
  keyword: "isEven",
  type: "number",
  schemaType: "boolean",
  validate: (schema, data) => !schema || data % 2 === 0,
});
```

## Upgrading from v2 to v3

v2.x releases of this library use [Ajv v6](https://www.npmjs.com/package/ajv/v/6.6.2).
v3.x of this library uses [Ajv v8](https://www.npmjs.com/package/ajv/v/8.11.0).

Notable changes between Ajv v6 and v8:

- All formats have been moved to [ajv-formats](https://www.npmjs.com/package/ajv-formats).
If you're using formats in your schemas, you must install this package and add it
to `validator.ajv` before calling `validate()`. See [Ajv instance](#ajv-instance).
- The structure of validation errors has changed.
- Support has been dropped for JSON Schema draft-04.

For full details, read the Ajv migration guide: [Changes from Ajv v6.12.6 to v8.0.0](https://ajv.js.org/v6-to-v8-migration.html).

If you have any Ajv plugins as dependencies, update them to their newest versions.
Older versions of Ajv plugins are less likely to be compatible with Ajv v8.

## Tests

Tests are written using [node-tap](https://www.npmjs.com/package/tap).

```
npm install

npm test
```

## More documentation on JSON Schema

- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/index.html)

## Credits

- Maintained by [@simonplend](https://github.com/simonplend/)
- Created and previously maintained by [@vacekj](https://github.com/vacekj/)
- Thank you to all of this project's [contributors](https://github.com/vacekj/express-json-validator-middleware/graphs/contributors)
- Based on the [express-json-schema](https://github.com/trainiac/express-jsonschema) library by [@trainiac](https://github.com/trainiac)
