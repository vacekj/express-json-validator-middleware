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
  type OptionKey = 'body' | 'params';
  
  type List<T> = {
    [K in OptionKey]?: T;
  } 

  export type ValidateFunction = Function | JSONSchema4 | JSONSchema6 | JSONSchema7

  export class Validator {
    constructor(options: AjvOptions);
    
    validate(options: List<ValidateFunction>): RequestHandler;
  }

  export class ValidationError extends Error {
    public validationErrors: List<ErrorObject>;
  }
}
