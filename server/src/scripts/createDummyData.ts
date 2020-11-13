import Database, { BoardModel, CategoryModel, ClueModel, UserDocument, UserModel } from "../database";

const createDummyUsers = async (): Promise<void> => {
	const users = [
		{ nickname: "king_kong", email: "king@test.com", password: "_PL<0okm" },
		{ nickname: "foobar", email: "foobar@test.com", password: "_PL<0okm" }
	];

	for (const user of users) {
		try {
			await UserModel.create(user);
			console.log(`Created user '${user.nickname}'`);
		} catch (error) {
			if (error.name === "MongoError" && error.code === 11000) {
				console.log(`User '${user.nickname}' already exists.`);
			} else {
				throw error;
			}
		}
	}
};

const getUser = async (nickName: string): Promise<UserDocument> => {
	const user = await UserModel.findOne({ nickname: nickName }).exec();
	if (!user) {
		throw new Error(`Required user '${nickName}' not found.`);
	}
	return user;
};

const createDummyBoards = async (): Promise<void> => {
	const foobarUser = await getUser("foobar");
	const kingKongUser = await getUser("king_kong");

	const boards = [
		{ name: "Civil War History", creator: foobarUser.id },
		{ name: "American Geography", creator: foobarUser.id },
		{ name: "Sports Universal", creator: foobarUser.id },
		{ name: "Science Fun", creator: kingKongUser.id }
	];

	for (const board of boards) {
		await BoardModel.create(board);
		console.log(`Created board '${board.name}'`);
	}
};

const processCategoryClues = async (clues: { answer: string; question: string }[]): Promise<string[]> => {
	let clueIds: string[] = [];
	for (const clue of clues) {
		clueIds.push((await ClueModel.create(clue)).id);
	}
	return clueIds;
};

const createDummyCategories = async (): Promise<void> => {
	const foobarUser = await getUser("foobar");
	const kingKongUser = await getUser("king_kong");

	const categories = [
		{
			name: "The Kraft Dynasty",
			description: "Fun fact about the great Kraft Dynasty",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "The Kraft Dynasty include this many Super Bowl appearances.",
					question: "What is 10?"
				},
				{
					answer:
						"In a comeback win over the Falcons, this running back scored the most points in any single Super Bowl.",
					question: "Who is James White?"
				},
				{
					answer: "The Patriots have had only two loosing season since Robert Kraft purchased the team in this year.",
					question: "What is 1994?"
				},
				{
					answer: "Under Kraft's ownership, the Patriots have won the AFC this many times.",
					question: "What is 19?"
				},
				{
					answer: "This running back and linebacker won ROTY awards while playing for Kraft's Patriots.",
					question: "Who are Curtis Martin and Jerod Mayo?"
				}
			])
		},
		{
			name: "The Sol System",
			description: "How well do you know our solar system?",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "This planet has more than double the mass of all the other planets combined",
					question: "What is Jupiter?"
				},
				{
					answer: "The winds on this planet reach up to 1,500 miles per hour.",
					question: "What is Neptune?"
				},
				{
					answer: "Phobos and Deimos are moons of this planet.",
					question: "What is Mars?"
				},
				{
					answer: "Beside Saturn, these three other planets in our solar system also have rings.",
					question: "What is Jupiter, Neptune, and Uranus?"
				},
				{
					answer: "This dwarf planet is the largest object in the astroid belt between Mars and Jupiter.",
					question: "What is Ceres?"
				}
			])
		},
		{
			name: "College Mascots",
			description: "Name the college mascot",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "Brown bears Joe & Josephine Bruin are the mascots for this Golden State university.",
					question: "What UCLA?"
				},
				{
					answer: "Not to be confused with Bevo, this costumed longhorn can be found on the sidelines at Texas games.",
					question: "Who is Hook'Em?"
				},
				{
					answer: "The seventh feline to bear this name now prowls Death Valley.",
					question: "What is Mike the Tiger?"
				},
				{
					answer: "This mammal is known for jumping around in his red and white sweater.",
					question: "Who is Bucky Badger?"
				},

				{
					answer: "Ten different Bluetick Coonhound have donned this moniker.",
					question: "What is Smokey?"
				}
			])
		}
	];

	for (const category of categories) {
		await CategoryModel.create(category);
		console.log(`Created category '${category.name}'`);
	}
};

const createDummyData = async (scripts: string[], url: string): Promise<void> => {
	if (scripts.length === 0) {
		return;
	}

	let database = new Database();
	database
		.connect(url)
		.then(async () => {
			for (const script of scripts) {
				try {
					switch (script) {
						case "boards":
							await createDummyBoards();
							break;
						case "categories":
							await createDummyCategories();
							break;
						case "users":
							await createDummyUsers();
							break;
						default:
							console.log(`Unknown script '${script}'.`);
					}
				} catch (error) {
					console.log(`Error running '${script}' script:`, error);
				}
			}

			database.disconnect();
		})
		.catch((error) => {
			console.log("Error connecting to database:", error);
		});
};

const addScript = (scripts: string[], newScript: string): void => {
	if (!scripts.includes(newScript)) {
		// Required prerequisite scripts
		if (newScript === "boards") {
			addScript(scripts, "users");
		} else if (newScript === "categories") {
			addScript(scripts, "users");
		}

		scripts.push(newScript);
	}
};

const parseArgs = (args: string[]): string[] => {
	let scripts: string[] = [];
	for (let i = 2; i < args.length; i++) {
		addScript(scripts, args[i]);
	}

	if (scripts.length === 0) {
		console.error("No scripts provided.");
	} else {
		console.log("Running scripts...", scripts);
	}

	return scripts;
};

createDummyData(parseArgs(process.argv), "mongodb://localhost:27017/");
