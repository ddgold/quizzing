import Database from "../database";

const createDummyUsers = (url: string): void => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			// Add scrap code here for testing mongoose

			database.disconnect();
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

createDummyUsers("mongodb://localhost:27017/");
