import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageManager = process.argv[2];
const validPackageManagers = new Set(["npm", "bun"]);

if (!validPackageManagers.has(packageManager)) {
	throw new Error(`Expected package manager to be one of ${Array.from(validPackageManagers).join(", ")}`);
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const packDirectory = "/tmp/express-json-validator-middleware-pack";
const sampleRoot = "/tmp/sample-express-app";
const sampleAppDirectory = path.join(sampleRoot, packageManager);

const sampleAppPackageJson = {
	name: "sample-express-app",
	private: true,
	type: "module"
};

const sampleAppSource = `import assert from "node:assert/strict";
import express from "express";

import { ValidationError, Validator } from "express-json-validator-middleware";

const app = express();

app.use(express.json());

const { validate } = new Validator({ allErrors: true });

const userSchema = {
	type: "object",
	required: ["name"],
	properties: {
		name: {
			type: "string"
		}
	}
};

const tokenSchema = {
	type: "object",
	required: ["token"],
	properties: {
		token: {
			type: "string",
			minLength: 36,
			maxLength: 36
		}
	}
};

const paramsSchema = {
	type: "object",
	required: ["id"],
	properties: {
		id: {
			type: "string",
			minLength: 36,
			maxLength: 36
		}
	}
};

app.post("/users/:id", validate({
	body: userSchema,
	params: paramsSchema,
	query: tokenSchema
}), (request, response) => {
	response.json({
		success: true,
		user: {
			id: request.params.id,
			name: request.body.name
		}
	});
});

app.post("/dynamic", validate({
	body(request) {
		if (request.query.requireAge === "1") {
			return {
				type: "object",
				required: ["name", "age"],
				properties: {
					name: {
						type: "string"
					},
					age: {
						type: "number"
					}
				}
			};
		}

		return userSchema;
	}
}), (request, response) => {
	response.json({
		success: true,
		body: request.body
	});
});

app.use((error, request, response, next) => {
	if (!(error instanceof ValidationError)) {
		next(error);
		return;
	}

	response.status(400).json({
		name: error.name,
		validationErrors: error.validationErrors
	});
});

const server = await new Promise((resolve, reject) => {
	const httpServer = app.listen(0, error => {
		if (error) {
			reject(error);
			return;
		}

		resolve(httpServer);
	});
});

try {
	const { port } = server.address();
	const baseUrl = \`http://127.0.0.1:\${port}\`;
	const validUuid = "123e4567-e89b-12d3-a456-426614174000";
	const validToken = "af3996d0-0e8b-4165-ae97-fdc0823be417";

	const invalidResponse = await fetch(\`\${baseUrl}/users/not-a-uuid?token=short\`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ name: 5 })
	});
	const invalidBody = await invalidResponse.json();

	if (invalidResponse.status !== 400) {
		throw new Error(\`Expected invalid response to return 400, received \${invalidResponse.status}\`);
	}

	assert.equal(invalidBody.name, "JsonSchemaValidationError");
	assert.ok(Array.isArray(invalidBody.validationErrors.body));
	assert.ok(Array.isArray(invalidBody.validationErrors.params));
	assert.ok(Array.isArray(invalidBody.validationErrors.query));

	const validResponse = await fetch(\`\${baseUrl}/users/\${validUuid}?token=\${validToken}\`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ name: "Bobinsky" })
	});
	const validBody = await validResponse.json();

	assert.equal(validResponse.status, 200);
	assert.deepEqual(validBody, {
		success: true,
		user: {
			id: validUuid,
			name: "Bobinsky"
		}
	});

	const dynamicInvalidResponse = await fetch(\`\${baseUrl}/dynamic?requireAge=1\`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ name: "Bobinsky" })
	});
	const dynamicInvalidBody = await dynamicInvalidResponse.json();

	assert.equal(dynamicInvalidResponse.status, 400);
	assert.ok(Array.isArray(dynamicInvalidBody.validationErrors.body));

	const dynamicValidResponse = await fetch(\`\${baseUrl}/dynamic?requireAge=1\`, {
		method: "POST",
		headers: {
			"content-type": "application/json"
		},
		body: JSON.stringify({ name: "Bobinsky", age: 42 })
	});
	const dynamicValidBody = await dynamicValidResponse.json();

	assert.equal(dynamicValidResponse.status, 200);
	assert.deepEqual(dynamicValidBody, {
		success: true,
		body: {
			age: 42,
			name: "Bobinsky"
		}
	});

	console.log("Sample app verification passed.");
} finally {
	await new Promise((resolve, reject) => {
		server.close(error => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});
}
`;

function run(command, args, cwd) {
	execFileSync(command, args, {
		cwd,
		stdio: "inherit",
		env: {
			...process.env,
			npm_config_cache: "/tmp/npm-cache",
			BUN_TMPDIR: "/tmp/bun-tmp",
			TMPDIR: "/tmp",
			BUN_INSTALL_CACHE_DIR: "/tmp/bun-cache",
			XDG_CACHE_HOME: "/tmp/xdg-cache"
		}
	});
}

await rm(packDirectory, { force: true, recursive: true });
await rm(sampleAppDirectory, { force: true, recursive: true });
await mkdir(packDirectory, { recursive: true });
await mkdir(sampleAppDirectory, { recursive: true });
await mkdir("/tmp/bun-tmp", { recursive: true });
await mkdir("/tmp/bun-cache", { recursive: true });
await mkdir("/tmp/xdg-cache", { recursive: true });

const packageArchiveName = execFileSync("npm", ["pack", "--pack-destination", packDirectory], {
	cwd: repositoryRoot,
	encoding: "utf8",
	env: {
		...process.env,
		npm_config_cache: "/tmp/npm-cache"
	}
}).trim().split("\n").pop();
const packageArchivePath = path.join(packDirectory, packageArchiveName);

await writeFile(
	path.join(sampleAppDirectory, "package.json"),
	JSON.stringify(sampleAppPackageJson, null, 2) + "\n"
);
await writeFile(path.join(sampleAppDirectory, "check.mjs"), sampleAppSource);

if (packageManager === "npm") {
	run("npm", ["install", "--no-package-lock", "express", packageArchivePath], sampleAppDirectory);
	run("node", ["check.mjs"], sampleAppDirectory);
} else {
	run("bun", ["add", "express", packageArchivePath], sampleAppDirectory);
	run("bun", ["check.mjs"], sampleAppDirectory);
}
