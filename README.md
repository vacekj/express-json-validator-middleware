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

## Ajv versions

Major version `1.x` of this module uses `ajv@5`, read their changelog and
migration guide [here](https://github.com/ajv-validator/ajv/releases/tag/5.0.0).

Major version `2.x` uses `ajv@6` in order to support draft-07 of JSON Schema.
You have to manually configure Ajv to support **draft-06** schemas
(see https://github.com/ajv-validator/ajv/tree/v6#using-version-6).

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
import { Validator, ValidationError } from "express-json-validator-middleware";

/**
 * Initialize a `Validator` instance, optionally passing in
 * an Ajv options object.
 *
 * @see https://github.com/ajv-validator/ajv/tree/v6#options
 */
const { validate } = new Validator({ allErrors: true });

/**
 * Optional: Alias the `Validator.validate` method for convenience.
 */
const validate = validator.validate;

/**
 * The `validate` method accepts an object which maps request
 * properties to the JSON schema which you want them to be
 * validated against e.g.
 *
 * {
 *   requestPropertyToValidate: jsonSchema
 * }
 *
 * Example: Validate `request.body` against `bodySchema`:
 */
app.post("/street", validate({ body: bodySchema }), (request, response) => {
    // route code
});
```

## Error handling

On encountering invalid data, the validator will call `next()` with a
`ValidationError` object. It is recommended to setup a general error handler
for your app where you will handle `ValidationError` errors.

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

// Create a `Validator` instance
const validator = new Validator({ allErrors: true });
const validate = validator.validate;

// Define a JSON Schema
const StreetSchema = {
    type: "object",
    required: ["number", "name", "type"],
    properties: {
        number: {
            type: "number"
        },
        name: {
            type: "string"
        },
        type: {
            type: "string",
            enum: ["Street", "Avenue", "Boulevard"]
        }
    }
};

const app = express();

app.use(express.json());

// This route validates `request.body` against the `StreetSchema`
app.post("/street/", validate({ body: StreetSchema }), (request, response) => {
    // At this point `request.body` has been validated
	// and you can execute your route code
    response.send("valid");
});

// Error handler for validation errors
app.use((error, request, response, next) => {
    if (error instanceof ValidationError) {
        // At this point you can execute your error handling code
        response.status(400).send("invalid");
        next();
    } else {
        // Pass error on if not a validation error
        next(error);
    }
});
```

## Validating multiple request properties

Sometimes your route may depend on the `body` and `query` both having a specific
format. In this example we use `body` and `query` but you can choose to validate
any `request` properties you like.

```javascript
const TokenSchema = {
    type: "object", // request.query is of type object
    required: ["token"], // request.query.token is required
    properties: {
        uuid: { // validate token
            type: "string",
            format: "uuid",
            minLength: 36,
            maxLength: 36
        }
    }
};

app.post("/street/", validate({ body: StreetSchema, query: TokenSchema }), (request, response) => {
    // route code
});
```

A valid request must now include a token URL query. Example valid URL:
`/street/?uuid=af3996d0-0e8b-4165-ae97-fdc0823be417`

## Using dynamic schema

Instead of passing in a schema object you can also pass in a function that will
return a schema. It is useful if you need to generate or alter the schema based
on the request object.

Example: Loading schema from the database:

```javascript
// Middleware executed before validate function
function loadSchema(request, response, next) {
    getSchemaFromDB()
        .then((schema) => {
            request.schema = schema;
            next();
        })
        .catch(next);
}

// Function which returns a schema object
function getSchema(request) {
	// return the schema from the previous middleware or the default schema
    return request.schema || DefaultSchema;
}

app.post("/street/", loadSchema, Validator.validate({ body: getSchema }), (request, response) => {
    // route code
});
```

## Ajv instance
The Ajv instance can be accessed via `validator.ajv`.

```js
var { Validator, ValidationError } = require('express-json-validator-middleware');
var validator = new Validator({allErrors: true});

validator.ajv // ajv instance
```

Ajv must be configured *before* you call `Validator.validate()` to add middleware. (e.g. if you need to define [custom keywords](https://ajv.js.org/custom.html)

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
