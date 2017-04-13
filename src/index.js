var Ajv = require('ajv');

class Validator {
    constructor(options) {
        this.ajv = new Ajv(options);
    }
    /**
     * Express middleware for validating requests
     *
     * @param {Object} options
     * @returns
     */
    validate(options) {
        var self = this;
        return function (req, res, next) {
            var validationErrors = {};

            Object.keys(options).forEach(function (requestProperty) {
                let schema = options[requestProperty];
                let validateFunction = this.ajv.compile(schema);

                var valid = validateFunction(req[requestProperty]);

                if (!valid) {
                    validationErrors[requestProperty] = validateFunction.errors;
                }
            }, self);

            if (Object.keys(validationErrors).length != 0) {
                next(new ValidationError(validationErrors));
            } else {
                next();
            }
        };
    }
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
    Validator,
    ValidationError
};