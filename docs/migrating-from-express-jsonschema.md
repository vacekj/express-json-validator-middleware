## Migrating from `express-jsonschema`

In `express-jsonschema`, you could define a `required` property in two ways.
Ajv only supports one way of doing this:

```javascript
// CORRECT
{
    type: 'object',
    properties: {
        foo: {
            type: 'string'
        }
    },
    required: ['foo'] // correct use of `required` keyword
}

// WRONG
{
    type: 'object',
    properties: {
        foo: {
            type: 'string',
            required: true // incorrect use of `required` keyword
        }
    }
}
```
