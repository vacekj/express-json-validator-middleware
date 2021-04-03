const { test } = require("tap");
const Ajv = require("ajv");

const { Validator } = require("../src");

test("Validator instance", async t => {
	t.type(new Validator().ajv, Ajv, " property `ajv` should be an Ajv instance");
});
