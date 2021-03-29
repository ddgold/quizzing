import Database from "../database";
import Engine from "../engine";

const testDatabase = async (url: string): Promise<void> => {
	try {
		await Database.connect(url);

		try {
			//
			// Add scrap code here for testing database
			//
		} catch (error) {
			console.error("Error testing database:", error);
		}

		await Database.disconnect();
		console.info("done");
	} catch (error) {
		console.error("Error connecting to database:", error);
	}
};

const testEngine = async (url: string): Promise<void> => {
	try {
		await Engine.connect(url);

		try {
			//
			// Add scrap code here for testing engine
			//
		} catch (error) {
			console.error("Error testing engine cache:", error);
		}

		await Engine.disconnect();
		console.info("done");
	} catch (error) {
		console.error("Error connecting to engine cache:", error);
	}
};

// testEngine("redis://localhost:6379/");
// testDatabase("mongodb://localhost:27017/");
