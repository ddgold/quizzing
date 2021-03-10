import Database from "../database";

const testMongoose = (url: string): void => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			// Add scrap code here for testing mongoose

			database.disconnect();
		})
		.catch((error) => {
			console.error("Error connecting to database:", error);
		});
};

testMongoose("mongodb://localhost:27017/");
