# express-json-validator-middleware
[express.js]( https://github.com/visionmedia/express ) middleware for JSON schema validation.

Based on https://github.com/trainiac/express-jsonschema

## Why use this library over express-jsonschema

- 

## Why validate with JSON schemas?

- **Simple** - JSON schemas are a simple and expressive way to describe a data structure that your API expects.
- **Standard** - JSON schemas are not specific to javascript. They are used in many server side languages. The standard specification lives here [json-schema.org][json-schema-url].
- **Fail-Fast** - Validating a payload before handing it to your application code will catch errors early that would otherwise lead to more confusing errors later.
- **Separate Validation** - Manually inspecting a payload for errors can get lengthy and clutter up your application code.
- **Error Messaging** -  Coming up with error messaging for every validation error becomes tedious and inconsistent.
- **Documentation** - Creating a JSON schema helps document the API requirements.

## Installation

```sh
$ npm install express-jsonschema
```

## Example

```js
var express = require('express');
var app = express();
var validate = require('express-jsonschema').validate;
var bodyParser = require('body-parser');

// Create a json scehma
var StreetSchema = {
    type: 'object',
    properties: {
        number: {
            type: 'number',
            required: true
        },
        name: {
            type: 'string',
            required: true
        },
        type: {
            type: 'string',
            required: true
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
    Setup a general error handler for JsonSchemaValidation errors.
    As mentioned before, how one handles an invalid request depends on their application.
    You can easily create some express error middleware
    (http://expressjs.com/guide/error-handling.html) to customize how your
    application behaves. When the express-jsonschema.validate middleware finds invalid data it
    passes an instance of JsonSchemaValidation to the next middleware.
    Below is an example of a general JsonSchemaValidation error handler for
    an application.
*/
app.use(function(err, req, res, next) {

    var responseData;

    if (err.name === 'JsonSchemaValidation') {
        // Log the error however you please
        console.log(err.message);
        // logs "express-jsonschema: Invalid data found"

        // Set a bad request http response status or whatever you want
        res.status(400);

        // Format the response body however you want
        responseData = {
           statusText: 'Bad Request',
           jsonSchemaValidation: true,
           validations: err.validations  // All of your validation information
        };

        // Take into account the content type if your app serves various content types
        if (req.xhr || req.get('Content-Type') === 'application/json') {
            res.json(responseData);
        } else {
            // If this is an html request then you should probably have
            // some type of Bad Request html template to respond with
            res.render('badrequestTemplate', responseData);
        }
    } else {
        // pass error to next error middleware handler
        next(err);
    }
});

app.use(bodyParser.json());
app.listen(8080, function(){
    console.log('app is running')
});
```

## Request

```
$ curl -H "Content-Type: application/json" -X POST -d '{ "number": "12", "type": "Drive"}' http://localhost:8080/street/
```

## Response

```js
{
    "statusText":"Bad Request",
    "jsonSchemaValidation":true,
    "validations":{
        "body":[{
            "value":"12",
            "property":"request.body.number",
            "messages":["is not of a type(s)number"]
        }, {
           "property":"request.body.name",
           "messages":["is required"]
        }, {
           "value":"Drive",
           "property":"request.body.type",
           "messages":["is not one of enum values: Street,Avenue,Boulevard"]
        }]
    }
}
```

## Validating multiple request properties

Sometimes your route may depend on the `body` and `query` both having a specific format.  In this
example I use `body` and `query` but you can choose to validate any `request` properties you'd like.

```js
var TokenSchema = {
    type: 'object',
    properties: {
        token: {
            type: 'string',
            format: 'alphanumeric',
            minLength: 10,
            maxLength: 10,
            required: true
        }
    }
}

app.post('/street/', validate({body: StreetSchema, query: TokenSchema}), function(req, res) {
    // application code
});
```

A valid request would now also require a url like `/street/?token=F42G5N5BGC`.


## Creating custom schema properties

While JSON schema comes with a lot of validation properties out of the box, you may want to add your own
custom properties. `addSchemaProperties` allows you to extend the validation properties that can be used in your
schemas. It should be called once at the beginning of your application so that your schemas will
have the custom properties available.

```javascript
var addSchemaProperties = require('express-jsonschema').addSchemaProperties;

addSchemaProperties({
    contains: function(value, schema){
        ...
    },
    isDoubleQuoted: function(value, schema){
        ...
    }
});
```
See [jsonschema's how to create custom properties](https://github.com/tdegrunt/jsonschema#custom-properties).

## Complex example, with split schemas and references

```js
var express = require('express');
var app = express();
var validate = require('express-jsonschema').validate;

// Address, to be embedded on Person
var AddressSchema = {
    "id": "/SimpleAddress",
    "type": "object",
    "properties": {
        "street": {"type": "string"},
        "zip": {"type": "string"},
        "city": {"type": "string"},
        "state": {"type": "string"},
        "country": {"type": "string"}
    }
};

// Person
var PersonSchema = {
    "id": "/SimplePerson",
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "address": {"$ref": "/SimpleAddress"}
    }
};

app.post('/person/', validate({body: PersonSchema}, [AddressSchema]), function(req, res) {
    // application code
});
```

A valid post body:

```json
{
    "name": "Barack Obama",
    "address": {
        "street": "1600 Pennsylvania Avenue Northwest",
        "zip": "20500",
        "city": "Washington",
        "state": "DC",
        "country": "USA"
    }
}
```

## More documentation on JSON schemas

- [scpacetelescope's understanding json schema](http://spacetelescope.github.io/understanding-json-schema/)
- [jsonschema][jsonschema-url]
- [json-schema.org][json-schema-url]
- [json schema generator](http://jsonschema.net/)
- [json schema google group](https://groups.google.com/forum/#!forum/json-schema)

## Notes

You can declare that something is required in your schema in two ways.

```js
{
    type: 'object',
    properties: {
        foo: {
            type: 'string',
            required: true
        }
    }
}

// OR

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
The first method works as expected with [jsonschema][jsonschema-url]. The second way has a few gotchas. I recommend using the first.

## Tests
Tests are written using [mocha](https://www.npmjs.com/package/mocha), [should](https://www.npmjs.com/package/should),
and [supertest](https://www.npmjs.com/package/supertest).

    npm test

## License

    express-jsonschema is licensed under MIT license.

    Copyright (C) 2015 Adrian Adkison <adkison.adrian@gmail.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
    of the Software, and to permit persons to whom the Software is furnished to do
    so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
