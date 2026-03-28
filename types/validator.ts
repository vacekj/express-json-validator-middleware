import { Validator } from "..";

const defaultValidator = new Validator();

defaultValidator.validate({
	body: {
		type: "object"
	}
});

const configuredValidator = new Validator({
	allErrors: true
});

configuredValidator.validate({
	body: {
		type: "object"
	}
});
