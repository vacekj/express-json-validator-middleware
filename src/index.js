var Ajv = require('ajv');
var ajv = new Ajv({
    allErrors: true
});


/**
 * Express middleware for validating requests
 *
 * @param {Object} options
 * @returns
 */
function validate(options) {
    return function (req, res, next) {
        var validationErrors = {};

        Object.keys(options).forEach(function (requestProperty) {
            let schema = options[requestProperty];
            let validateFunction = ajv.compile(schema);

            var valid = validateFunction(req[requestProperty]);

            if (!valid) {
                validationErrors[requestProperty] = validateFunction.errors;
            }
        });

        if (Object.keys(validationErrors).length != 0) {
            next(new ValidationError(validationErrors));
        } else {
            next();
        }
    };
}


/**
 * Validation Error
 *
 * @class ValidationError
 * @extends {Error}
 */
class ValidationError extends Error {

    /**
     * Creates an instance of ValidationError.
     * @param {any} validationErrors
     *
     * @memberOf ValidationError
     */
    constructor(validationErrors) {
        super();
        this.name = 'JsonSchemaValidationError';
        this.validationErrors = validationErrors;
    }
};

module.exports = {
    validate,
    ValidationError
};