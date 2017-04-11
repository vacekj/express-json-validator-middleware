# express-json-validator-middleware
[express.js]( https://github.com/visionmedia/express ) middleware for JSON schema validation.

***WIP, suggestions / bug reports are welcome!***

Based heavily on https://github.com/trainiac/express-jsonschema.

## Why use this library over [express-jsonschema](https://github.com/trainiac/express-jsonschema) ?

- **Performance** -  Uses [ajv](https://github.com/epoberezkin/ajv) instead of [JSONSchema](https://github.com/tdegrunt/jsonschema), performing 80% better than [express-jsonschema](https://github.com/trainiac/express-jsonschema)

## Why validate with JSON schemas?

- **Simple** - JSON schemas are a simple and expressive way to describe a data structure that your API expects.
- **Standard** - JSON schemas are not specific to Javascript. They are used in many server side languages. The standard specification lives here [json-schema.org][json-schema-url].
- **Fail-Fast** - Validating a payload before handing it to your application code will catch errors early that would otherwise lead to more confusing errors later.
- **Separate Validation** - Manually inspecting a payload for errors can get lengthy and clutter up your application code.
- **Error Messaging** -  Coming up with error messaging for every validation error becomes tedious and inconsistent.
- **Documentation** - Creating a JSON schema helps document the API requirements.

## Installation

```sh
$ npm install express-json-validator-middleware
```

## Example

```js
var express = require('express');
var app = express();
var validate = require('express-json-validator-middleware').validate;
var bodyParser = require('body-parser');

// Create a json scehma
var StreetSchema = {
    type: 'object',
    required: ['number, name, type'],
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

/*
    Setup a general error handler for JsonSchemaValidationError errors.
    As mentioned before, how one handles an invalid request depends on their application.
    You can easily create some express error middleware
    (http://expressjs.com/guide/error-handling.html) to customize how your
    application behaves. When the express-jsonschema.validate middleware finds invalid data it
    passes an instance of JsonSchemaValidationError to the next middleware.
```


## Validating multiple request properties

Sometimes your route may depend on the `body` and `query` both having a specific format.  In this example I use `body` and `query` but you can choose to validate any `request` properties you'd like. 

```js
var TokenSchema = {
    type: 'object',
    required: ['token']
    properties: {
        token: {
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

A valid request would now also require a url like `/street/?token=F42G5N5BGC`.


## More documentation on JSON schemas

- [scpacetelescope's understanding json schema](http://spacetelescope.github.io/understanding-json-schema/)
- [jsonschema][jsonschema-url]
- [json-schema.org][json-schema-url]
- [json schema generator](http://jsonschema.net/)
- [json schema google group](https://groups.google.com/forum/#!forum/json-schema)

## Notes

In express-jsonschema, you could define a required property in two ways. Ajv only supports the first latter

```js
// WRONG
{
    type: 'object',
    properties: {
        foo: {
            type: 'string',
            required: true
        }
    }
}

// CORRECT

{
    type: 'object',
    properties: {
        foo: {
            type: 'string'
        },
        required: ['foo']
    }
}
```

Huge thanks to 