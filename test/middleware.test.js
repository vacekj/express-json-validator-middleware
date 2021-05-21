const { test } = require("tap");

const { Validator, ValidationError } = require("../src");

test("Validator#validate middleware configured with a schema object", async t => {
	const middleware = new Validator().validate({
		body: {
			required: ["name"],
			properties: {
				name: {
					type: "string"
				}
			}
		}
	});

	t.test("should call next() with a ValidationError when there are validation errors", t => {
		t.plan(1);

		middleware(
			{ body: {} },
			{},
			function next(error) {
				t.type(error, ValidationError);
			}
		);
	});

	t.test("should call next() with no arguments when there are no validation errors", t => {
		t.plan(1);

		middleware(
			{ body: { name: "Bobinsky" } },
			{},
			function next(error) {
				t.type(error, undefined);
			}
		);
	});
});

test("Validator#validate middleware configured with a dynamic schema function", async t => {
	function getSchema() {
		return {
			properties: {
				name: {
					type: "string"
				}
			},
			required: ["name"]
		};
	}

	const middleware = new Validator().validate({
		body: getSchema
	});

	t.test("should call next() with a ValidationError when there are validation errors", t => {
		t.plan(1);

		middleware(
			{ body: {} },
			{},
			function next(error) {
				t.type(error, ValidationError);
			}
		);
	});

	t.test("should call next() with no arguments when there are no validation errors", t => {
		t.plan(1);

		middleware(
			{ body: { name: "Bobinsky" } },
			{},
			function next(error) {
				t.type(error, undefined);
			}
		);
	});
});
