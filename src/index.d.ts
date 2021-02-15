import { Request } from "express";
import { RequestHandler } from "express-serve-static-core";
import { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";
import { Ajv, ErrorObject, Options as AjvOptions } from "ajv";

declare module "express-json-validator-middleware" {
	type OptionKey = "body" | "params" | "query";

	type List<T> = {
		[K in OptionKey]?: T;
	};

	type AllowedSchema =
		| JSONSchema4
		| JSONSchema6
		| JSONSchema7;

	export type ValidateFunction =
		| ((req: Request) => AllowedSchema)
		| AllowedSchema;

	export class Validator {
		constructor(options: AjvOptions);

		ajv: Ajv;

		validate(rules: List<ValidateFunction>): RequestHandler;
	}

	export class ValidationError extends Error {
		constructor(validationErrors: List<ErrorObject[]>);
		public validationErrors: List<ErrorObject[]>;
	}
}
