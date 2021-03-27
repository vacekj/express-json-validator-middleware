# Express JSON Validator Middleware

> [Express](https://github.com/expressjs/express/) middleware for validating
requests against JSON schemas.

[![npm version](https://img.shields.io/npm/v/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm monthly downloads](https://img.shields.io/npm/dm/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm license](https://img.shields.io/npm/l/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![Build status](https://github.com/vacekj/express-json-validator-middleware/workflows/Node.js%20CI/badge.svg)](https://github.com/vacekj/express-json-validator-middleware/actions?query=workflow%3A%22Node.js+CI%22)
[![codecov](https://codecov.io/gh/vacekj/express-json-validator-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/vacekj/express-json-validator-middleware)

## Why validate with JSON schemas?

- **Simple** - JSON schemas are a simple and expressive way to describe a data structure.
- **Standard** - JSON schemas are not specific to JavaScript. In fact, they are used just about everywhere.
- **Fail-Fast** - Catch errors early in your logic, evading confusing errors later.
- **Separate Validation** - Keep your routes clean. Validation logic doesn't need to be defined in your route handlers.
- **Error Messaging** - Ajv provides you with rich error objects that can easily be transformed into human-readable format.
- **Documentation** - Creating a JSON Schema is another way of documenting your application.

## Why use this library over `express-jsonschema`?

- **Performance** - [Ajv](https://github.com/ajv-validator/ajv/tree/v6) offers a [significant performance boost over](https://github.com/ebdrup/json-schema-benchmark/blob/master/README.md#performance) JSONSchema.
- **Latest JSON Schema Standard** - [ajv](https://github.com/epoberezkin/ajv) supports JSON Schema v7 proposal.
- **Active Maintenance** - `express-json-validator-middleware` is being actively maintained.

Coming from `express-jsonschema`? Read our [migration notes](docs/migrating-from-express-jsonschema.md).

## Install

```sh
npm install express-json-validator-middleware
```

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
 * @see https://github.com/ajv-validator/ajv/tree/v6#options
 */
 const { validate } = new Validator();

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

const { validate } = new Validator();

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
`/street/?uuid=af3996d0-0e8b-4165-ae97-fdc0823be417`

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

The Ajv instance can be accessed via `validator.ajv`.

```javascript
import { Validator, ValidationError } from "express-json-validator-middleware";

const validator = new Validator();

// Ajv instance
validator.ajv;
```

Ajv must be configured *before* you call `Validator.validate()` to add middleware
(e.g. if you need to define [custom keywords](https://ajv.js.org/custom.html).

## Ajv versions

The major version `1.x` of this module uses `ajv@5`, read their changelog and
migration guide [here](https://github.com/ajv-validator/ajv/releases/tag/5.0.0).

Major version `2.x` uses `ajv@6` in order to support draft-07 of JSON Schema.
You have to manually configure Ajv to support **draft-06** schemas
(see https://github.com/ajv-validator/ajv/tree/v6#using-version-6).

## Tests

Tests are written using Mocha & Chai.

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
