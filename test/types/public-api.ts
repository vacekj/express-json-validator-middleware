import type { Request } from "express";

import {
	type AllowedSchema,
	type ValidationErrorsMap,
	type ValidationSchemaMap,
	ValidationError,
	Validator
} from "express-json-validator-middleware";

const baseSchema: AllowedSchema = {
	type: "object",
	required: ["id"],
	properties: {
		id: {
			type: "string"
		}
	}
};

const rules: ValidationSchemaMap = {
	body: baseSchema,
	params: baseSchema,
	query(request: Request) {
		return request.query.strict === "1" ? baseSchema : {
			type: "object",
			properties: {
				optionalId: {
					type: "string"
				}
			}
		};
	},
	tenant: baseSchema
};

const validator = new Validator();

validator.validate(rules);

const validationErrors: ValidationErrorsMap = {
	body: [],
	tenant: []
};

new ValidationError(validationErrors);
