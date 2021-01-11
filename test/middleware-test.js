const expect = require("chai").expect;
const { Validator, ValidationError } = require("../src");

const ajv = require("ajv").default;

describe("Simulated Middleware", () => {
	describe("Basic Use Case", () => {
		const middleware = new Validator().validate({
			body: {
				properties: {
					name: {
						type: "string"
					}
				},
				required: ["name"]
			}
		});

		it("should throw ValidationError on bad data", () => {
			expect(() =>
				middleware(
					{
						body: {}
					},
					{},
					function next(err) {
						throw err;
					}
				)
			)
				.to
				.throw(ValidationError);
		});

		it("should call next() on good data", () => {
			let nextCalled = false;
			expect(() =>
				middleware(
					{
						body: {
							name: "nikolay"
						}
					},
					{},
					function next() {
						nextCalled = true;
					}
				)
			)
				.not
				.to
				.throw();
			expect(nextCalled).to.be.true;
		});
	});

	describe("Dynamic Schema Use Case", () => {
		const getSchema = req => {
			return {
				properties: {
					name: {
						type: "string"
					}
				},
				required: ["name"]
			};
		};

		const middleware = new Validator().validate({
			body: getSchema
		});

		it("should throw ValidationError on bad data", () => {
			expect(() =>
				middleware(
					{
						body: {}
					},
					{},
					function next(err) {
						throw err;
					}
				)
			)
				.to
				.throw(ValidationError);
		});

		it("should call next() on good data", () => {
			let nextCalled = false;
			expect(() =>
				middleware(
					{
						body: {
							name: "nikolay"
						}
					},
					{},
					function next() {
						nextCalled = true;
					}
				)
			)
				.not
				.to
				.throw();
			expect(nextCalled).to.be.true;
		});
	});

	describe("Predefined Schema", () => {

		const schemas = {
			something: {
				type: 'object',
				required: ['prop'],
				properties: {
					prop: {
						type: 'integer'
					}
				}
			},
			otherthing: {
				type: 'object',
				required: ['name', 'proptwo'],
				additionalProperties: false,
				properties: {
					name: {
						type: 'string'
					},
					proptwo: {
						"$ref": "something"
					}
				}
			}
		};

		const middleware = new Validator({ schemas: schemas }).validate({
			body: 'otherthing'
		});

		it("should throw ValidationError on bad data", () => {
			expect(() =>
				middleware(
					{
						body: {}
					},
					{},
					function next(err) {
						throw err;
					}
				)
			)
				.to
				.throw(ValidationError);
		});

		it("should call next() on good data", () => {
			let nextCalled = false;
			expect(() =>
				middleware(
					{
						body: {
							name: "nikolay",
							proptwo: 123
						}
					},
					{},
					function next() {
						nextCalled = true;
					}
				)
			)
				.not
				.to
				.throw();
			expect(nextCalled).to.be.true;
		});
	});

	describe("Validator instance", () => {
		it("should be able to access ajv instance at Validator.ajv", () => {
			expect(new Validator())
				.to
				.haveOwnProperty("ajv");
			expect(new Validator().ajv)
				.to
				.be
				.an
				.instanceof(ajv);
		});
	});
});
