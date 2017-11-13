# express-json-validator-middleware
[express.js](https://github.com/visionmedia/express) middleware for validating requests against JSON Schema

[![Build Status](https://travis-ci.org/JouzaLoL/express-json-validator-middleware.svg?branch=master)](https://travis-ci.org/JouzaLoL/express-json-validator-middleware)
[![codecov](https://codecov.io/gh/JouzaLoL/express-json-validator-middleware/branch/master/graph/badge.svg)](https://codecov.io/gh/JouzaLoL/express-json-validator-middleware)
[![npm](https://img.shields.io/npm/dm/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm](https://img.shields.io/npm/v/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)
[![npm](https://img.shields.io/npm/l/express-json-validator-middleware.svg)](https://www.npmjs.com/package/express-json-validator-middleware)

<hr>

Coming from `express-jsonschema`? Read our [migration notes](#migrating)

Starting with `1.1.0`, this module uses `ajv@5`, read their changelog and migration guide [here](https://github.com/epoberezkin/ajv/releases/tag/5.0.0).

## Why use this library over [express-jsonschema](https://github.com/trainiac/express-jsonschema) ?

- **Performance** - [ajv](https://github.com/epoberezkin/ajv) offers a [significant performance boost over](https://github.com/ebdrup/json-schema-benchmark/blob/master/README.md#performance) JSONSchema.
- **Latest JSON Schema Standard** - [ajv](https://github.com/epoberezkin/ajv) supports JSON Schema v6 proposal.
- **Active Maintenance** - `express-json-validator-middleware` is being actively maintained.

## Why validate with JSON schemas?

- **Simple** - JSON schemas are a simple and expressive way to describe a data structure.
- **Standard** - JSON schemas are not specific to Javascript. In fact, they are used just about everywhere.
- **Fail-Fast** - Catch errors early in your logic, evading confusing errors later.
- **Separate Validation** - Keep your routes clean. Validation logic doesn't need to be defined in your route handlers.
- **Error Messaging** - Ajv provides you with rich error objects that can easily be transformed into human-readable format.
- **Documentation** - Creating a JSON Schema is another way of documenting your application.

## Installation

```sh
$ npm install express-json-validator-middleware
```

`--save` is no longer necessary as of `npm@5`

## Getting started

0. Install the module
1. Require the module
```js
var { Validator, ValidationError } = require('express-json-validator-middleware');
```

2. Initialize a Validator instance, optionally passing in an [ajv#options](https://github.com/epoberezkin/ajv#options) object

```js
var validator = new Validator({allErrors: true});
```

3. *Optional* - Define a shortcut function.
```js
var validate = validator.validate;
```

4. Use the function as an Express middleware, passing in an options object of the following format:
```js
validate({
    request_property: schema_to_use
})
```

Example: Validate req.body against BodySchema

```js
app.post('/street/', validate({body: BodySchema}), function(req, res) {
    // route code
});
```

## Error handling

On encountering erroneous data, the validator will call next() with a ValidationError object.
It is recommended to setup a general error handler for your app where you will catch ValidationError errors

Example - error thrown for the `body` request property

```js
ValidationError {
    name: 'JsonSchemaValidationError',
    validationErrors: {
        body: [AjvError]
    }
}
```

More information on [ajv#errors](https://github.com/epoberezkin/ajv#validation-errors)

## Example Express app

```js
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var { Validator, ValidationError } = require('express-json-validator-middleware');

// Initialize a Validator instance first
var validator = new Validator({allErrors: true}); // pass in options to the Ajv instance

// Define a shortcut. It is perfectly okay to use validator.validate() as middleware, this just makes it easier
var validate = validator.validate;

// Define a JSON Schema
var StreetSchema = {
    type: 'object',
    required: ['number', 'name', 'type'],
    properties: {
        number: {
            type: 'number'
        },
        name: {
            type: 'string'
        },
        type: {
            type: 'string',
            enum: ['Street', 'Avenue', 'Boulevard']
        }
    }
}

// This route validates req.body against the StreetSchema
app.post('/street/', validate({body: StreetSchema}), function(req, res) {
    // At this point req.body has been validated and you can
    // begin to execute your application code
});
```

## Validating multiple request properties

Sometimes your route may depend on the `body` and `query` both having a specific format.  In this example we use `body` and `query` but you can choose to validate any `request` properties you like. 

```js
var TokenSchema = {
    type: 'object', // req.query is of type object
    required: ['token'] // req.query.token is required
    properties: {
        token: { // validate token
            type: 'string', 
            format: 'alphanumeric',
            minLength: 10,
            maxLength: 10
        }
    }
}

app.post('/street/', validate({body: StreetSchema, query: TokenSchema}), function(req, res) {
    // application code
});
```

A valid request must now include a token URL query. Example valid URL: `/street/?token=F42G5N5BGC`

## Custom keywords

Ajv custom keywords must be defined *before* any validate() middleware

Example:

```js
var { Validator, ValidationError } = require('express-json-validator-middleware');
var validator = new Validator({allErrors: true});

validator.ajv.addKeyword('constant', { validate: function (schema, data) {
  return typeof schema == 'object' && schema !== null
          ? deepEqual(schema, data)
          : schema === data;
}, errors: false });

// route handlers with validate()
```

More info on custom keywords: [ajv#customs-keywords](https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md#defining-custom-keywords)

## Ajv instance
The Ajv instance can be accessed via validator.ajv.

```js
var { Validator, ValidationError } = require('express-json-validator-middleware');
var validator = new Validator({allErrors: true});

validator.ajv // ajv instance
```

## Tests
Tests are written using Mocha & Chai

```
npm install
npm test
```


## More documentation on JSON schemas

- [spacetelescope's understanding json schema](http://spacetelescope.github.io/understanding-json-schema/)

## <a name="migrating"></a> Migrating from `express-jsonschema`

In `express-jsonschema`, you could define a required property in two ways. Ajv only supports one way of doing this.

```js
// CORRECT
{
    type: 'object',
    properties: {
        foo: {
            type: 'string'
        },
        required: ['foo'] // <-- correct way
    }
}

// WRONG
{
    type: 'object',
    properties: {
        foo: {
            type: 'string',
            required: true // nono way
        }
    }
}
```

## Credits

- Maintained by [@JouzaLoL](https://github.com/jouzalol)
- [Original Module](https://github.com/trainiac/express-jsonschema) by [@trainiac](https://github.com/trainiac)
- PRs: 
	- [@GochoMugo](https://github.com/GochoMugo)
	- [@teobaranga](https://github.com/teobaranga)