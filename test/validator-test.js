const expect = require('chai').expect;
const {
    Validator
} = require('../src');

describe('Validator', () => {
	describe('Basic Validation', () => {
		const SCHEMA = {
			properties: {
				name: {
					type: 'string',
					maxLength: 8
				},
				info: {
					type: 'object',
					properties: {
						age: {
							type: 'integer',
							maximum: 100
						},
						name: {
							type: 'object',
							properties: {
								first: {
									type: 'string'
								},
								last: {
									type: 'string'
								}
							},
							required: ['first', 'last']
						}
					},
					required: ['age']
				}
			},
			required: ['name']
		};

		const BAD_DATA = {
			name: 'Super Nikolay',
			info: {
				age: 666,
				name: {
					last: false
				}

			}
		};
		const GOOD_DATA = {
			name: 'Nikolay'
		};

		const validate = new Validator().ajv.compile(SCHEMA);

		it('Rejects bad data', () => {
			let validated = validate(BAD_DATA);
			expect(validated).to.be.false;
			expect(validate.errors).to.have.length;
		});

		it('Approves good data', () => {
			let validated = validate(GOOD_DATA);
			expect(validated).to.be.true;
		});
	});
});