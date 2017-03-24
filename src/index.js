var Ajv = require('ajv');
var ajv = new Ajv({
    allErrors: true
});

function validate(options) {

    return function (req, res, next) {
        let validationErrors = {};

        Object.keys(options).forEach(function (requestProperty) {
            let schema = options[requestProperty];
            let validate = ajv.compile(schema);

            let valid = validate(req[requestProperty]);

            if (!valid) {
                validationErrors.push(valid.errors);
            }
        });

        if (validationErrors) {
            next(new ValidationError(localize.en(validate.errors)));
        } else {
            next();
        }
    };
}

class ValidationError extends Error {
    constructor(validationErrors) {
        super();
        this.name = 'JsonSchemaValidation';
        this.message = 'express-jsonschema: Invalid data found';
        this.validationErrors = validationErrors;
    }
};

module.exports = {
    validate,
    ValidationError
};