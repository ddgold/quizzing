import { AccessLevel } from "../auth";
import Database, { BoardDocument, BoardModel, CategoryDocument, CategoryModel, ClueModel, UserDocument, UserModel } from "../database";

interface RawUser {
	nickname: string;
	email: string;
	password: string;
	created: Date;
	lastLogin: Date;
	access: AccessLevel;
}

const createUser = async (user: RawUser): Promise<void> => {
	try {
		await UserModel.create(user);
		console.info(`Created user '${user.nickname}'`);
	} catch (error) {
		if (error.name === "MongoError" && error.code === 11000) {
			console.info(`User '${user.nickname}' already exists.`);
		} else {
			throw error;
		}
	}
};

const createAdminUser = async (): Promise<void> => {
	return createUser({
		nickname: "admin",
		email: "admin@test.com",
		password: "_PL<0okm",
		created: new Date(),
		lastLogin: new Date(),
		access: AccessLevel.Admin
	});
};

const createDummyUsers = async (): Promise<void[]> => {
	const users: RawUser[] = [
		{
			nickname: "king_kong",
			email: "king@test.com",
			password: "_PL<0okm",
			created: new Date(),
			lastLogin: new Date(),
			access: AccessLevel.User
		},
		{
			nickname: "foobar",
			email: "foobar@test.com",
			password: "_PL<0okm",
			created: new Date(),
			lastLogin: new Date(),
			access: AccessLevel.User
		}
	];

	return Promise.all(
		users.map((user: RawUser) => {
			return createUser(user);
		})
	);
};

const getUser = async (nickName: string): Promise<UserDocument> => {
	const user = await UserModel.findOne({ nickname: nickName }).exec();
	if (!user) {
		throw new Error(`Required user '${nickName}' not found.`);
	}
	return user;
};

const getBoard = async (name: string): Promise<BoardDocument> => {
	const board = await BoardModel.findOne({ name: name }).exec();
	if (!board) {
		throw new Error(`Required board '${board}' not found.`);
	}
	return board;
};

const getCategory = async (name: string): Promise<CategoryDocument> => {
	const category = await CategoryModel.findOne({ name: name }).exec();
	if (!category) {
		throw new Error(`Required category '${category}' not found.`);
	}
	return category;
};

const createDummyBoards = async (): Promise<void> => {
	const kingKong = await getUser("king_kong");

	const kraftDynasty = await getCategory("The Kraft Dynasty");
	const solSystem = await getCategory("The Sol System");
	const collegeMascots = await getCategory("College Mascots");
	const colors = await getCategory("1st Grade Colors");
	const capitals = await getCategory("State Capitals");
	const languages = await getCategory("Foreign Languages");

	const boards = [
		{
			name: "Random Trivia",
			description: "",
			categories: [kraftDynasty.id, solSystem.id, collegeMascots.id, colors.id, capitals.id, languages.id],
			creator: kingKong.id,
			created: new Date(),
			updated: new Date()
		}
	];

	for (const board of boards) {
		try {
			await getBoard(board.name);
			console.info(`Board '${board.name}' already exists.`);
		} catch (error) {
			await BoardModel.create(board);
			console.info(`Created board '${board.name}'`);
		}
	}
};

const processCategoryClues = async (clues: { answer: string; question: string }[]): Promise<string[]> => {
	let clueIds: string[] = [];
	for (const clue of clues) {
		clueIds.push((await ClueModel.getClueId(clue)).id);
	}
	return clueIds;
};

const createDummyCategories = async (): Promise<void> => {
	const kingKongUser = await getUser("king_kong");

	const categories = [
		{
			name: "The Kraft Dynasty",
			description: "Fun fact about the great Kraft Dynasty",
			format: "FIXED",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "The Kraft Dynasty include this many Super Bowl appearances.",
					question: "What is 10?"
				},
				{
					answer: "In a comeback win over the Falcons, this running back scored the most points in any single Super Bowl.",
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
			format: "FIXED",
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
			format: "FIXED",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "Brown bears Joe & Josephine Bruin are the mascots for this Golden State university.",
					question: "What is UCLA?"
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
		},
		{
			name: "1st Grade Colors",
			description: "Simple question about colors",
			format: "FIXED",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "Fire trucks are traditionally this color.",
					question: "What is red?"
				},
				{
					answer: "Chloroplasts organelles responsible for photosynthesis give plants this color.",
					question: "What is green?"
				},
				{
					answer: "When ripe, bananas turn this color.",
					question: "What is yellow?"
				},
				{
					answer: "The two Gs in Google's logo are this color.",
					question: "What is blue?"
				},
				{
					answer: "This color has the shortest wave length in ROYGBIV.",
					question: "What is violet?"
				}
			])
		},
		{
			name: "State Capitals",
			description: "Can you name all the state capitals? There are only 50.",
			format: "RANDOM",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "This city become a state capital in 1832, moving from Portland.",
					question: "What is Augusta?"
				},
				{
					answer: "At over 1.7 million residents, this is the largest state capital.",
					question: "What is Phoenix?"
				},
				{
					answer: "Originally called Waterloo, this city received its current name when it became the state capital.",
					question: "What is Austin?"
				},
				{
					answer: "This city is the badger state's capital.",
					question: "What is Madison?"
				},
				{
					answer: "This state capital is named for a Germany chancellor.",
					question: "What is Bismark?"
				},
				{
					answer: "Independence Hall is located in this state capital.",
					question: "What is Philadelphia?"
				}
			])
		},
		{
			name: "Foreign Languages",
			description: "Name the college mascot",
			format: "FIXED",
			creator: kingKongUser.id,
			created: new Date(),
			updated: new Date(),
			clues: await processCategoryClues([
				{
					answer: "Now an internationally recognized phrase, Ciao originated from this language.",
					question: "What is Italian?"
				},
				{
					answer: "With approximately 250,000, this language has the most distinct words.",
					question: "What is English?"
				},
				{
					answer: "This artifact help decipher ancient Egyptian hieroglyphs.",
					question: "What is the Rosetta Stone?"
				},
				{
					answer: "Nein, not to be confused with the number nine, means no in this language",
					question: "Who is German?"
				},
				{
					answer: "This language has the most native speakings, at over 900 million.",
					question: "What is Mandarin Chinese?"
				}
			])
		}
	];

	for (const category of categories) {
		try {
			await getCategory(category.name);
			console.info(`Category '${category.name}' already exists.`);
		} catch (error) {
			await CategoryModel.create(category);
			console.info(`Created category '${category.name}'`);
		}
	}
};

const createDummyData = async (scripts: string[], url: string): Promise<void> => {
	if (scripts.length === 0) {
		return;
	}

	try {
		await Database.connect(url);
		for (const script of scripts) {
			try {
				switch (script) {
					case "boards": {
						await createDummyBoards();
						break;
					}
					case "categories": {
						await createDummyCategories();
						break;
					}
					case "users": {
						await createDummyUsers();
						break;
					}
					case "admin": {
						await createAdminUser();
						break;
					}
					default: {
						console.error(`Unknown script '${script}'.`);
					}
				}
			} catch (error) {
				console.error(`Error running '${script}' script:`, error);
			}
		}

		await Database.disconnect();
		console.info("done");
	} catch (error) {
		console.error("Error connecting to database:", error);
	}
};

const addScript = (scripts: string[], newScript: string): void => {
	if (!scripts.includes(newScript)) {
		// Required prerequisite scripts
		if (newScript === "boards") {
			addScript(scripts, "users");
			addScript(scripts, "categories");
		} else if (newScript === "categories") {
			addScript(scripts, "users");
		}

		scripts.push(newScript);
	}
};

const parseArgs = (args: string[]): string[] => {
	let scripts: string[] = [];
	for (let i = 2; i < args.length; i++) {
		addScript(scripts, args[i]!);
	}

	if (scripts.length === 0) {
		console.error("No scripts provided.");
	} else {
		console.info("Running scripts...", scripts);
	}

	return scripts;
};

createDummyData(parseArgs(process.argv), "mongodb://localhost:27017/");
