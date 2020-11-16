import path from "path";
import fs from "fs";

let secrets: { [name: string]: string } = {};

const checkEnvironmentVariables = (environmentVariables: string[]): void => {
	for (const variableName of environmentVariables) {
		if (!process.env[variableName]) {
			console.error(`Required environment variable '${variableName}' not provided.`);
			process.exit();
		}
	}
};

const checkDockerSecrets = (dockerSecrets: string[]): void => {
	let directory = path.resolve(__dirname, process.env.SECRETS_DIR!);
	for (const secretName of dockerSecrets) {
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
	}
};

export const getDockerSecret = (secretName: string): string => {
	return secrets[secretName];
};

export const environmentConfig = (environmentVariables: string[], dockerSecrets: string[]): void => {
	checkEnvironmentVariables(environmentVariables);
	checkDockerSecrets(dockerSecrets);
};
