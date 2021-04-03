const { test } = require("tap");
const sget = require("simple-get").concat;

const express = require("express");

const { Validator } = require("../src");

test("Express app route using Validator#validate middleware", async t => {
	const app = express();

	app.use(express.json());

	const { validate } = new Validator();

	const userSchema = {
		type: "object",
		required: ["name"],
		properties: {
			name: {
				type: "string"
			}
		}
	};

	app.post("/user", validate({ body: userSchema }), (request, response) => {
		response.json({ success: true });
	});

	app.use(function errorHandlerMiddleware(error, request, response, next) {
		response.status(400).json(error);
	});

	t.before(() => {
		return new Promise((resolve, reject) => {
			const httpServer = app.listen(0, () => {
				t.context.httpServer = httpServer;
				t.context.rootUrl = `http://127.0.0.1:${httpServer.address().port}`;
				resolve();
			});
		});
	});

	t.teardown(() => t.context.httpServer.close());

	t.test("should send an error response when request body is invalid", t => {
		t.plan(3);

		sget({
			url: t.context.rootUrl + "/user",
			method: "POST",
			headers: {
				'content-type': 'application/json'
			},
			body: { name: null },
			json: true
		}, (error, response, body) => {
			t.error(error);
			t.equal(response.statusCode, 400);
			t.match(body, { name: "JsonSchemaValidationError" });
		});
	});

	t.test("should send a success response when request body is valid", t => {
		t.plan(3);

		sget({
			url: t.context.rootUrl + "/user",
			method: "POST",
			headers: {
				'content-type': 'application/json'
			},
			body: { name: "jake" },
			json: true
		}, (error, response, body) => {
			t.error(error);
			t.equal(response.statusCode, 200);
			t.same(body, { success: true });
		});
	});
});
