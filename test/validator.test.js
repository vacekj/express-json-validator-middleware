const { test } = require("tap");
const Ajv = require("ajv");

const { ValidationError, Validator } = require("../src");

test("Validator instance", async t => {
	t.type(new Validator().ajv, Ajv, " property `ajv` should be an Ajv instance");
});

test("ValidationError instance", async t => {
	const validationErrors = {
		params: [
			{
				instancePath: "/id",
				schemaPath: "#/properties/id/maxLength",
				keyword: "maxLength",
				params: { limit: 2 },
				message: "should NOT be longer than 2 characters"
			}
		]
	};

	const validationError = new ValidationError(validationErrors);

	t.equal(validationError.name, "JsonSchemaValidationError");
	t.same(validationError.validationErrors, validationErrors);
});
