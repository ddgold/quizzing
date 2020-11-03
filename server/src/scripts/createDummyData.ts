import { exit } from "process";
import Database, { UserModel } from "../database";

const createDummyUsers = (url: string) => {
	let database = new Database(url);
	database
		.connect()
		.then(async () => {
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

				database.disconnect();
			} catch (error) {
				console.log("Error creating user:", error);
				exit();
			}
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

createDummyUsers("mongodb://localhost:27017/");
