import path from "path";
import fs from "fs";

export const debugModeOn = (): boolean => {
	return process.argv.includes("--debug");
};

export const verboseModeOn = (): boolean => {
	return process.argv.includes("--verbose");
};

// ---------------------
// Environment Variables
// ---------------------
type EnvironmentVariable = "NODE_ENV" | "FRONTEND_URL" | "DATABASE_URL" | "ENGINE_CACHE_URL" | "JUDGE_URL" | "SECRETS_DIR" | "SERVER_PORT";

const allEnvironmentVariable: EnvironmentVariable[] = [
	"NODE_ENV",
	"FRONTEND_URL",
	"DATABASE_URL",
	"ENGINE_CACHE_URL",
	"JUDGE_URL",
	"SECRETS_DIR",
	"SERVER_PORT"
];

const checkEnvironmentVariables = (): void => {
	for (const variableName of allEnvironmentVariable) {
		if (!process.env[variableName]) {
			console.error(`Required environment variable '${variableName}' not provided.`);
			process.exit();
		}

		if (verboseModeOn()) {
			console.info(`Environment variable: ${variableName}=${process.env[variableName]}`);
		}
	}
};

export const getEnvironmentVariable = (variableName: EnvironmentVariable): string => {
	return process.env[variableName]!;
};

// --------------
// Docker Secrets
// --------------
type DockerSecret = "access_token" | "judge_token" | "refresh_token";

const allDockerSecrets: DockerSecret[] = ["access_token", "judge_token", "refresh_token"];

let secrets: { [name: string]: string } = {};

const checkDockerSecrets = (): void => {
	let directory = path.resolve(__dirname, getEnvironmentVariable("SECRETS_DIR"));
	for (const secretName of allDockerSecrets) {
		try {
			let secretValue = fs.readFileSync(path.join(directory, secretName), "utf8");
			if (!secretValue) {
				console.error(`Required secret '${secretName}' not provided.`);
				process.exit();
			} else {
				secrets[secretName] = secretValue;
			}
		} catch (error) {
			console.error(`Error reading secret '${secretName}': ${error}`);
			process.exit();
		}

		if (verboseModeOn()) {
			console.info(`Docker secret: ${secretName}=${secrets[secretName]}`);
		}
	}
};

export const getDockerSecret = (secretName: DockerSecret): string => {
	return secrets[secretName]!;
};

export const checkEnvironmentConfig = (): void => {
	checkEnvironmentVariables();
	checkDockerSecrets();
};
