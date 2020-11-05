import Database, { UserModel } from "../database";

const createDummyUsers = (url: string) => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			const collections = ["boards", "users"];

			try {
				for (const collection of collections) {
					await database.connection.dropCollection(collection);
				}

				database.disconnect();
			} catch (error) {
				console.log("Error dropping collections:", error);
				process.exit();
			}
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

createDummyUsers("mongodb://localhost:27017/");
