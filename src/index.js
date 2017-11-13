var Ajv = require('ajv');

/**
 * Express middleware for validating requests
 * 
 * @class Validator
 */
class Validator {
	constructor(ajvOptions) {
		this.ajv = new Ajv(ajvOptions);
		this.validate = this.validate.bind(this);
	}
    /**
     * Validator method to be used as middleware
     * 
     * @param {Object} options Options in format { request_property: schema }
     * @returns 
     */
	validate(options) {
		// Self is a reference to the current Validator instance
		var self = this;

		// The actual middleware function
		return function (req, res, next) {
			var validationErrors = {};

			Object.keys(options).forEach(function (requestProperty) {
				let schema = options[requestProperty];
				let validateFunction = this.ajv.compile(schema);
				let valid = validateFunction(req[requestProperty]);

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
	constructor(validationErrors) {
		super();
		this.name = 'JsonSchemaValidationError';
		this.validationErrors = validationErrors;
	}
}

module.exports = {
	Validator,
	ValidationError
};