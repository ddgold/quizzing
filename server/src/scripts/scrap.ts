import Database from "../database";
import Engine from "../engine";

const testDatabase = async (url: string): Promise<void> => {
	try {
		console.info("Database test...");
		await Database.connect(url);

		try {
			//
			// Add scrap code here for testing database
			//
		} catch (error) {
			console.error("Error testing database:", error);
		}

		await Database.disconnect();
		console.info("Done");
	} catch (error) {
		console.error("Error connecting to database:", error);
	}
};

const testEngine = async (url: string): Promise<void> => {
	try {
		console.info("Engine test...");
		await Engine.connect(url);

		try {
			//
			// Add scrap code here for testing engine
			//
		} catch (error) {
			console.error("Error testing engine cache:", error);
		}

		await Engine.disconnect();
		console.info("Done");
	} catch (error) {
		console.error("Error connecting to engine cache:", error);
	}
};

const scrap = async (command: string) => {
	if (["all", "engine", "redis"].includes(command)) {
		await testEngine("redis://localhost:6379/");
	}
	if (["all", "database", "mongo"].includes(command)) {
		await testDatabase("mongodb://localhost:27017/");
	}
};

scrap(process.argv[2] || "all");
