const chai = require('chai');
chai.use(require('chai-http'));
const expect = require('chai').expect;
const {
    Validator
} = require('../src');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var validator = new Validator({
    allErrors: true
});
var validate = validator.validate;

var personSchema = {
    properties: {
        name: {
            type: 'string'
        }
    }
};

app.post('/street/', validate({
    body: personSchema
}), function (req, res) {
    res.json({
        success: true
    });
});

app.use((err, req, res, next) => {
    res.status(400).json(err);
});

describe('Integration', () => {
    describe('Basic Use Case', () => {
        it('should return a ValidationError on bad data', (done) => {
            let badJson = {
                name: null
			};
			
            chai.request(app)
                .post('/street')
                .send(badJson)
                .end((err, res) => {
                    expect(res.error).to.not.be.null;
                    expect(res.error).to.have.status(400);
                    expect(res.body.name).to.equal('JsonSchemaValidationError');
                    done();
                });
        });

        it('should return normal response on good data', (done) => {
            let goodJson = {
                name: "jake"
            };
            chai.request(app)
                .post('/street')
                .send({
                    Street: goodJson
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.success).to.be.true;
                    done();
                });
        });
    });
});