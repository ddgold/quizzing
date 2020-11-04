import Database, { BoardModel, UserModel } from "../database";

const createDummyUsers = async () => {
	const users = [
		{ nickname: "Emma", email: "emma@test.com", password: "Pa$sw0rd" },
		{ nickname: "Jack", email: "jack@test.com", password: "Pa$sw0rd" },
		{ nickname: "Oliver", email: "oliver@test.com", password: "Pa$sw0rd" },
		{ nickname: "William", email: "william@test.com", password: "Pa$sw0rd" },
		{ nickname: "Ethan", email: "ethan@test.com", password: "Pa$sw0rd" }
	];

	try {
		for (const user of users) {
			await UserModel.create(user);
			console.log(`Created user ${user.nickname} ${user.email}`);
		}
	} catch (error) {
		console.log("Error creating user:", error);
		process.exit();
	}
};

const createDummyBoards = async () => {
	const boards = [
		{ name: "Civil War History" },
		{ name: "American Geography" },
		{ name: "Sports Universal" },
		{ name: "Science Fun" }
	];

	try {
		for (const board of boards) {
			await BoardModel.create(board);
			console.log(`Created board ${board.name}`);
		}
	} catch (error) {
		console.log("Error creating user:", error);
		process.exit();
	}
};

const createDummyData = (url: string) => {
	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			await createDummyUsers();
			await createDummyBoards();

			database.disconnect();
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

createDummyData("mongodb://localhost:27017/");
