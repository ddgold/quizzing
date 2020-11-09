import Database, { UserModel } from "../database";

const dropCollections = (collections: string[], url: string): void => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			for (const collection of collections) {
				try {
					await database.connection.dropCollection(collection);
				} catch (error) {
					if (error.codeName === "NamespaceNotFound") {
						console.log(`No '${collection}' collection found.`);
					} else {
						console.log(`Error dropping '${collection}' collection:`, error);
					}
				}
			}

			database.disconnect();
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

const parseArgs = (args: string[]): string[] => {
	let collections: string[] = [];
	for (let i = 2; i < args.length; i++) {
		collections.push(args[i]);
	}

	if (collections.length === 0) {
		collections = ["boards", "categories", "clues"];
		console.log("Dropping default collections...", collections);
	} else if (collections.includes("all")) {
		collections = ["boards", "categories", "clues", "users"];
		console.log("Dropping ALL collections...", collections);
	} else {
		console.log("Dropping collections...", collections);
	}

	return collections;
};

dropCollections(parseArgs(process.argv), "mongodb://localhost:27017/");
