import express from "express";
import type { JSONSchemaType } from "ajv";

import {
	type AllowedSchema,
	ValidationError,
	Validator
} from "express-json-validator-middleware";

type Address = {
	street: string;
};

const addressSchema: AllowedSchema & JSONSchemaType<Address> = {
	type: "object",
	required: ["street"],
	properties: {
		street: {
			type: "string"
		}
	}
};

const app = express();
const { validate } = new Validator({ allErrors: true });

app.post("/address", validate({ body: addressSchema }), (request, response) => {
	response.json({ street: request.body.street });
});

app.use((error: unknown, request: express.Request, response: express.Response, next: express.NextFunction) => {
	if (error instanceof ValidationError) {
		response.status(400).json(error.validationErrors);
		return;
	}

	next(error);
});
