import Ajv from "ajv";
import type { ErrorObject, Options as AjvOptions } from "ajv";
import type { Request, RequestHandler } from "express";
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from "json-schema";

export type AllowedSchema =
	| JSONSchema4
	| JSONSchema6
	| JSONSchema7;

export type ValidateFunction =
	| AllowedSchema
	| ((req: Request) => AllowedSchema);

export interface ValidationSchemaMap {
	[requestProperty: string]: ValidateFunction | undefined;
	body?: ValidateFunction;
	params?: ValidateFunction;
	query?: ValidateFunction;
}

export interface ValidationErrorsMap {
	[requestProperty: string]: ErrorObject[] | null | undefined;
	body?: ErrorObject[] | null;
	params?: ErrorObject[] | null;
	query?: ErrorObject[] | null;
}

export class Validator {
	constructor(options?: AjvOptions);

	ajv: Ajv;

	validate(rules: ValidationSchemaMap): RequestHandler;
}

export class ValidationError extends Error {
	constructor(validationErrors: ValidationErrorsMap);

	validationErrors: ValidationErrorsMap;
}
