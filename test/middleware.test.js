const assert = require("node:assert/strict");
const test = require("node:test");

const { ValidationError, Validator } = require("../src");

const bodySchema = {
	type: "object",
	required: ["name"],
	properties: {
		name: {
			type: "string"
		}
	}
};

test("Validator#validate middleware configured with a schema object returns ValidationError for invalid input", async () => {
	const middleware = new Validator().validate({ body: bodySchema });

	await new Promise((resolve, reject) => {
		middleware({ body: {} }, {}, error => {
			try {
				assert.ok(error instanceof ValidationError);
				assert.equal(error.name, "JsonSchemaValidationError");
				assert.ok(Array.isArray(error.validationErrors.body));
				resolve();
			} catch (assertionError) {
				reject(assertionError);
			}
		});
	});
});

test("Validator#validate middleware configured with a schema object calls next() without an error for valid input", async () => {
	const middleware = new Validator().validate({ body: bodySchema });

	await new Promise((resolve, reject) => {
		middleware({ body: { name: "Bobinsky" } }, {}, error => {
			try {
				assert.equal(error, undefined);
				resolve();
			} catch (assertionError) {
				reject(assertionError);
			}
		});
	});
});

test("Validator#validate middleware configured with a dynamic schema function validates requests", async () => {
	const middleware = new Validator().validate({
		body(request) {
			if (request.query.requireAge === "1") {
				return {
					type: "object",
					required: ["name", "age"],
					properties: {
						name: { type: "string" },
						age: { type: "number" }
					}
				};
			}

			return bodySchema;
		}
	});

	await new Promise((resolve, reject) => {
		middleware({ body: { name: "Bobinsky" }, query: { requireAge: "1" } }, {}, error => {
			try {
				assert.ok(error instanceof ValidationError);
				assert.ok(Array.isArray(error.validationErrors.body));
				resolve();
			} catch (assertionError) {
				reject(assertionError);
			}
		});
	});

	await new Promise((resolve, reject) => {
		middleware({ body: { name: "Bobinsky", age: 42 }, query: { requireAge: "1" } }, {}, error => {
			try {
				assert.equal(error, undefined);
				resolve();
			} catch (assertionError) {
				reject(assertionError);
			}
		});
	});
});

test("Validator#validate accepts custom request properties", async () => {
	const middleware = new Validator().validate({
		tenant: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string" }
			}
		}
	});

	await new Promise((resolve, reject) => {
		middleware({ tenant: {} }, {}, error => {
			try {
				assert.ok(error instanceof ValidationError);
				assert.ok(Array.isArray(error.validationErrors.tenant));
				resolve();
			} catch (assertionError) {
				reject(assertionError);
			}
		});
	});
});
