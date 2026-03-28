const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ejvm-types-"));
const tarballDir = path.join(tempDir, "tarballs");
const sourcePath = path.join(tempDir, "consumer.ts");

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		...options
	});

	if (result.status !== 0) {
		process.stdout.write(result.stdout);
		process.stderr.write(result.stderr);
		process.exit(result.status || 1);
	}

	return result.stdout;
}

try {
	fs.mkdirSync(tarballDir, { recursive: true });
	fs.writeFileSync(
		sourcePath,
		[
			'import { ValidationError, Validator } from "express-json-validator-middleware";',
			"",
			"const defaultValidator = new Validator();",
			"",
			"defaultValidator.validate({",
			"\tbody: {",
			'\t\ttype: "object"',
			"\t}",
			"});",
			"",
			"const configuredValidator = new Validator({",
			"\tallErrors: true",
			"});",
			"",
			"configuredValidator.validate({",
			"\tbody: {",
			'\t\ttype: "object"',
			"\t}",
			"});",
			"",
			"const validationError = new ValidationError({",
			"\tparams: [",
			"\t\t{",
			'\t\t\tinstancePath: "/id",',
			'\t\t\tschemaPath: "#/properties/id/maxLength",',
			'\t\t\tkeyword: "maxLength",',
			"\t\t\tparams: { limit: 2 },",
			'\t\t\tmessage: "should NOT be longer than 2 characters"',
			"\t\t}",
			"\t]",
			"});",
			"",
			"validationError.validationErrors.params?.[0].keyword;",
			""
		].join("\n")
	);

	const tarballName = run(
		"npm",
		["pack", ".", "--pack-destination", tarballDir],
		{ cwd: repoRoot }
	).trim();

	fs.writeFileSync(
		path.join(tempDir, "package.json"),
		JSON.stringify({ name: "ejvm-types-test", private: true }, null, 2)
	);

	run(
		"npm",
		[
			"install",
			"--ignore-scripts",
			"--no-package-lock",
			"typescript@4.9.5",
			path.join(tarballDir, tarballName)
		],
		{ cwd: tempDir }
	);

	run(
		path.join(tempDir, "node_modules", ".bin", "tsc"),
		["--noEmit", "--strict", "--skipLibCheck", sourcePath],
		{ cwd: tempDir }
	);
} finally {
	fs.rmSync(tempDir, { force: true, recursive: true });
}
