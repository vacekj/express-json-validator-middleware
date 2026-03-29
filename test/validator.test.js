const assert = require("node:assert/strict");
const test = require("node:test");

const Ajv = require("ajv");

const { ValidationError, Validator } = require("../src");

test("Validator instances expose the underlying Ajv instance", () => {
	assert.ok(new Validator().ajv instanceof Ajv);
});

test("ValidationError includes a stable message and validationErrors payload", () => {
	const validationErrors = {
		body: [{ instancePath: "/name", keyword: "type", params: {}, schemaPath: "#/properties/name/type" }]
	};
	const error = new ValidationError(validationErrors);

	assert.equal(error.message, "Request validation failed");
	assert.deepEqual(error.validationErrors, validationErrors);
});
