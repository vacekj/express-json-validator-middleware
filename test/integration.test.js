const assert = require("node:assert/strict");
const test = require("node:test");

const express = require("express");

const { ValidationError, Validator } = require("../src");

test("Express routes using Validator#validate middleware validate request bodies, params, and query strings", async t => {
	const app = express();

	app.use(express.json());

	const { validate } = new Validator();

	const addressSchema = {
		type: "object",
		required: ["street"],
		properties: {
			street: {
				type: "string"
			}
		}
	};

	const tokenSchema = {
		type: "object",
		required: ["token"],
		properties: {
			token: {
				type: "string",
				minLength: 36,
				maxLength: 36
			}
		}
	};

	const paramsSchema = {
		type: "object",
		required: ["uuid"],
		properties: {
			uuid: {
				type: "string",
				minLength: 36,
				maxLength: 36
			}
		}
	};

	app.post("/address/:uuid", validate({
		body: addressSchema,
		params: paramsSchema,
		query: tokenSchema
	}), (request, response) => {
		response.json({ street: request.body.street, success: true });
	});

	app.use((error, request, response, next) => {
		if (!(error instanceof ValidationError)) {
			next(error);
			return;
		}

		response.status(400).json({
			name: error.name,
			validationErrors: error.validationErrors
		});
	});

	const httpServer = await new Promise((resolve, reject) => {
		const server = app.listen(0, error => {
			if (error) {
				reject(error);
				return;
			}

			resolve(server);
		});
	});

	t.after(async () => {
		await new Promise((resolve, reject) => {
			httpServer.close(error => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	});

	const { port } = httpServer.address();
	const validUuid = "123e4567-e89b-12d3-a456-426614174000";
	const validToken = "af3996d0-0e8b-4165-ae97-fdc0823be417";
	const baseUrl = `http://127.0.0.1:${port}`;

	const invalidResponse = await fetch(`${baseUrl}/address/not-a-uuid?token=short`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ street: 7 })
	});
	const invalidBody = await invalidResponse.json();

	assert.equal(invalidResponse.status, 400);
	assert.equal(invalidBody.name, "JsonSchemaValidationError");
	assert.ok(Array.isArray(invalidBody.validationErrors.body));
	assert.ok(Array.isArray(invalidBody.validationErrors.params));
	assert.ok(Array.isArray(invalidBody.validationErrors.query));

	const validResponse = await fetch(`${baseUrl}/address/${validUuid}?token=${validToken}`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ street: "Main Street" })
	});
	const validBody = await validResponse.json();

	assert.equal(validResponse.status, 200);
	assert.deepEqual(validBody, {
		street: "Main Street",
		success: true
	});
});
