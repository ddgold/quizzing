import Database from "../database";

const dropCollections = async (collections: string[], url: string): Promise<void> => {
	try {
		await Database.connect(url);

		for (const collection of collections) {
			try {
				await Database.connection.dropCollection(collection);
			} catch (error) {
				if (error.codeName === "NamespaceNotFound") {
					console.error(`No '${collection}' collection found.`);
				} else {
					console.error(`Error dropping '${collection}' collection:`, error);
				}
			}
		}

		await Database.disconnect();
		console.info("done");
	} catch (error) {
		console.error("Error connecting to database:", error);
	}
};

const parseArgs = (args: string[]): string[] => {
	let collections: string[] = [];
	for (let i = 2; i < args.length; i++) {
		collections.push(args[i]);
	}

	if (collections.length === 0) {
		collections = ["boards", "categories", "clues"];
		console.info("Dropping default collections...", collections);
	} else if (collections.includes("all")) {
		collections = ["boards", "categories", "clues", "users"];
		console.info("Dropping ALL collections...", collections);
	} else {
		console.info("Dropping collections...", collections);
	}

	return collections;
};

dropCollections(parseArgs(process.argv), "mongodb://localhost:27017/");
