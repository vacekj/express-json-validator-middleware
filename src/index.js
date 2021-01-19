var Ajv = require("ajv").default;

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
		const self = this;

		// Cache validate functions
		const validateFunctions = Object.keys(options)
			.map(function (
				requestProperty
			) {
				const schema = options[requestProperty];
				let validateFunction = null;
				switch (typeof schema) {
					case "function":
						return { requestProperty, schemaFunction: schema };
					case "string":
						validateFunction = (toValidate) => this.ajv.validate(schema, toValidate);
						break;
					default:
						validateFunction = this.ajv.compile(schema);
						break;
				}
				return { requestProperty, validateFunction };
			},
				self);

		// The actual middleware function
		return (req, res, next) => {
			let validationErrors = {};

			for (let {
				requestProperty,
				validateFunction,
				schemaFunction
			} of validateFunctions) {
				if (!validateFunction) {
					// Get the schema from the dynamic schema function
					const schema = schemaFunction(req);
					validateFunction = this.ajv.compile(schema);
				}

				// Test if property is valid
				const valid = validateFunction(req[requestProperty]);
				if (!valid) {
					validationErrors[requestProperty]
						= validateFunction.errors ? validateFunction.errors : this.ajv.errors;
				}
			}

			if (Object.keys(validationErrors).length !== 0) {
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
		this.name = "JsonSchemaValidationError";
		this.validationErrors = validationErrors;
	}
}

module.exports = {
	Validator,
	ValidationError
};
