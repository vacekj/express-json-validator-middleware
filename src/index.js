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
                validationErrors[requestProperty] = valid.errors;
            }
        });

        if (Object.keys(validationErrors).length) {
            next(new ValidationError(validationErrors));
        } else {
            next();
        }
    };
}

class ValidationError extends Error {};

module.exports = {
    validate,
    ValidationError
};