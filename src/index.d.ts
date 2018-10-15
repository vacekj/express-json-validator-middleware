import { Request } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import {
  JSONSchema4,
  JSONSchema6,
  JSONSchema7,
} from 'json-schema';
import {
  Options as AjvOptions,
  ErrorObject,
} from 'ajv';

declare module 'express-json-validator-middleware' {
  type ValidateFunction = Function | JSONSchema4 | JSONSchema6 | JSONSchema7

  interface ValidationErrors {
    [key: string]: ErrorObject;
  }

  class Validator {
    constructor(options: AjvOptions);
    
    validate(options: Options): RequestHandler;
  }

  interface Options {
    [key: string]: ValidateFunction;
  }

  class ValidationError extends Error {
    public validationErrors: ValidationErrors;
  }
}
