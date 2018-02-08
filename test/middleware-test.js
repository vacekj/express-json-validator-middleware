const expect = require('chai').expect;
const {
    Validator,
	ValidationError
} = require('../src');

describe('Simulated Middleware', () => {
	describe('Basic Use Case', () => {
		const middleware = new Validator().validate({
			body: {
				properties: {
					name: {
						type: 'string',
						
					}
				},
				required: ['name']
			}
		});

		it('should throw ValidationError on bad data', () => {
			expect(() => middleware({
				body: {}
			}, {}, function next(err) {
				throw err;
			})).to.throw(ValidationError);
		});

		it('should call next() on good data', () => {
			let nextCalled = false;
			expect(() => middleware({
				body: {
					name: 'nikolay'
				}
			}, {}, function next() {
				nextCalled = true;
			})).not.to.throw();
			expect(nextCalled).to.be.true;
		});
	});

	describe('Dynamic Schema Use Case', () => {
		const getSchema = (req) => {
			return {
				properties: {
					name: {
						type: 'string',
					}
				},
				required: ['name']
			};
		};
		
		const middleware = new Validator().validate({
			body: getSchema
		});

		it('should throw ValidationError on bad data', () => {
			expect(() => middleware({
				body: {}
			}, {}, function next(err) {
				throw err;
			})).to.throw(ValidationError);
		});

		it('should call next() on good data', () => {
			let nextCalled = false;
			expect(() => middleware({
				body: {
					name: 'nikolay'
				}
			}, {}, function next() {
				nextCalled = true;
			})).not.to.throw();
			expect(nextCalled).to.be.true;
		});
	});
});