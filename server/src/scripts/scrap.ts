import Database, { BoardModel, UserModel } from "../database";

const createDummyUsers = (url: string): void => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			const id = "5fa818b3fd4cac382262d758";

			const board = await BoardModel.findById(id).populate("creator").exec();

			console.log(board);

			database.disconnect();
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

createDummyUsers("mongodb://localhost:27017/");
