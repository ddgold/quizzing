import { ForbiddenError, ResolverFn, ValidationError, withFilter } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis, { Redis as RedisClient, RedisOptions } from "ioredis";
import { v4 as uuid } from "uuid";

import { TokenPayload } from "../auth";
import { BoardModel, CategoryDocument, UserModel } from "../database";
import { ActiveClueObject, GameObject, State, RowObject, PlayerArray } from "../objects/play";
import { Fields, Keys } from "./game";

export default class Engine {
	// --------
	// Instance
	// --------
	private client: RedisClient;
	private pubsub: RedisPubSub;

	private constructor(options: RedisOptions) {
		this.pubsub = new RedisPubSub({
			publisher: new Redis(options),
			subscriber: new Redis(options)
		});
		this.client = new Redis(options);
	}

	// ---------
	// Singleton
	// ---------
	private static singleton: Engine | undefined;

	private static get client(): RedisClient {
		if (this.singleton === undefined) {
			throw new Error("Engine cache not connected");
		}

		return this.singleton.client;
	}

	private static get pubsub(): RedisPubSub {
		if (this.singleton === undefined) {
			throw new Error("Engine cache not connected");
		}

		return this.singleton.pubsub;
	}

	static async connect(url: string): Promise<string> {
		if (this.singleton !== undefined) {
			throw new Error("Engine cache already connected");
		}

		// TODO: actually use url param
		this.singleton = new Engine({});
		return url;
	}

	static async disconnect(): Promise<void> {
		if (this.singleton === undefined) {
			throw new Error("Engine cache not connected");
		}

		await Promise.all([this.client.quit(), this.pubsub.close()]);
		this.singleton = undefined;
	}

	// -------
	// Helpers
	// -------
	private static async assertState(gameId: string, requiredState: State | "Any" | null): Promise<void> {
		const currentState = await this.client.hget(Keys.ActiveGame(gameId), Fields.State());
		if (currentState === null && requiredState !== null) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		} else if (currentState !== null && requiredState === null) {
			throw new ValidationError(`Game with id '${gameId}' already exists`);
		} else if (currentState !== requiredState && requiredState !== "Any") {
			throw new ValidationError(`Game with id '${gameId}' found state '${currentState}' expecting '${requiredState}'`);
		}
	}

	private static async assertUser(gameId: string, userId: string, limit: "Any" | "Active" | "HaventGuessed"): Promise<void> {
		if (limit === "Active") {
			const activePlayer = await this.client.hget(Keys.ActiveGame(gameId), Fields.ActivePlayer());
			if (!activePlayer || activePlayer !== userId) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}
		} else {
			if (limit === "HaventGuessed") {
				const activeClue = await this.getActiveClue(gameId);
				if (activeClue.alreadyGuessed.includes(userId)) {
					throw new ForbiddenError(`Can't access game with id '${gameId}'`);
				}
			}

			const players = await this.getPlayers(gameId);
			if (!this.playersInclude(players, userId)) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}
		}
	}

	private static async getModel(gameId: string): Promise<GameObject> {
		const hash = await this.client.hgetall(Keys.ActiveGame(gameId));

		if (Object.keys(hash).length === 0) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		}

		const [cols, rows] = hash[Fields.Size()]!.split("^").map((string) => {
			return Number.parseInt(string);
		}) as [number, number];

		let categories = Array<string>(cols).fill("");
		let models: RowObject[] = [];
		for (let row = 0; row < rows; row++) {
			let model: RowObject = { value: hash[Fields.Value(row)]!, cols: [] };
			for (let col = 0; col < cols; col++) {
				if (hash[Fields.Clue(row, col)] !== undefined) {
					model.cols.push(false);
					categories[col] = hash[Fields.Category(col)]!;
				} else {
					model.cols.push(true);
				}
			}
			models.push(model);
		}

		const state = hash[Fields.State()] as State;
		let currentText: string | undefined;
		if (state === "ShowingAnswer" || state === "AwaitingResponse" || state === "ShowingQuestion") {
			const activeClue: ActiveClueObject = JSON.parse(hash[Fields.ActiveClue()]!);
			if (state === "ShowingQuestion") {
				currentText = activeClue.question;
			} else {
				currentText = activeClue.answer;
			}
		}

		const model: GameObject = {
			id: gameId,
			name: hash[Fields.Name()]!,
			categories: categories,
			rows: models,
			state: state,
			currentText: currentText,
			activePlayer: hash[Fields.ActivePlayer()],
			players: JSON.parse(hash[Fields.Players()]!),
			started: new Date(hash[Fields.Started()]!)
		};

		return model;
	}

	private static async getModels(gameIds: string[]): Promise<GameObject[]> {
		return Promise.all(
			gameIds.map(async (gameId) => {
				await this.assertState(gameId, "Any");
				return await this.getModel(gameId);
			})
		);
	}

	private static async getActiveClue(gameId: string): Promise<ActiveClueObject> {
		return JSON.parse((await this.client.hget(Keys.ActiveGame(gameId), Fields.ActiveClue()))!);
	}

	private static async getPlayers(gameId: string): Promise<PlayerArray> {
		const value = await this.client.hget(Keys.ActiveGame(gameId), Fields.Players());
		if (value === null) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		}

		return JSON.parse(value);
	}

	private static playersInclude(players: PlayerArray, targetId: string): boolean {
		return players.some((player) => {
			return player && player.id === targetId;
		});
	}

	private static sanitizeString(string: string): string {
		return string
			.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+']/g, " ")
			.replace(/\s{2,}/g, " ")
			.trim()
			.toLocaleLowerCase();
	}

	private static responseCorrect(response: string, correct: string): boolean {
		return this.sanitizeString(response) === this.sanitizeString(correct);
	}

	private static async isGameOver(gameId: string): Promise<boolean> {
		let cursor = "0";
		do {
			const [newCursor, result] = await this.client.hscan(Keys.ActiveGame(gameId), cursor, "MATCH", Fields.Clue("*", "*"));

			if (result.length > 0) {
				return false;
			}

			cursor = newCursor;
		} while (cursor !== "0");

		return true;
	}

	private static async publishPlayGame(gameId: string): Promise<GameObject> {
		const model = await this.getModel(gameId);

		await this.pubsub.publish("PLAY_GAME", {
			playGame: model
		});

		return model;
	}

	// --------------
	// Public Methods
	// --------------
	static async host(boardId: string, userId: string, cols: number = 6, rows: number = 5, players: number = 3): Promise<string> {
		const gameId = uuid();
		await this.assertState(gameId, null);

		let board = await BoardModel.record(boardId);

		if (board.categories.length < cols) {
			throw new ValidationError(`Board '${board.name}' does not have at least ${cols} categories`);
		}

		const map = new Map<string, string>();
		map.set(Fields.Name(), board.name);
		map.set(Fields.Host(), userId);
		map.set(Fields.Players(), JSON.stringify(new Array(players).fill(null)));
		map.set(Fields.State(), "AwaitingPlayers");
		map.set(Fields.Started(), new Date().toUTCString());
		map.set(Fields.Size(), `${cols}^${rows}`);

		for (let col = 0; col < cols; col++) {
			const randomIndex = Math.floor(Math.random() * board.categories.length);
			const category = board.categories.splice(randomIndex, 1)[0] as CategoryDocument;

			map.set(Fields.Category(col), category.name);

			const clues = await category.generateColumn(rows);
			for (let row = 0; row < clues.length; row++) {
				map.set(Fields.Clue(row, col), JSON.stringify(clues[row], ["answer", "question"]));
			}
		}

		for (let row = 0; row < rows; row++) {
			map.set(Fields.Value(row), `${(row + 1) * 200}`);
		}

		await this.client.multi().hset(Keys.ActiveGame(gameId), map).sadd(Keys.PublicGames(), gameId).exec();
		await this.join(gameId, userId);

		return gameId;
	}

	static async join(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "AwaitingPlayers");

		const players = await this.getPlayers(gameId);
		if (this.playersInclude(players, userId)) {
			throw new ValidationError(`Already joined game with id '${gameId}'`);
		}

		const freeSlot = players.indexOf(null);
		if (freeSlot === -1) {
			throw new ValidationError(`Game with id '${gameId}' is full`);
		}

		const user = await UserModel.findById(userId);
		if (!user) {
			throw new ValidationError(`User with id '${userId}' does not exist`);
		}

		players[freeSlot] = {
			id: userId,
			nickname: user.nickname,
			alreadyGuessed: false,
			score: 0
		};

		let pipe = this.client
			.multi()
			.sadd(Keys.UsersGames(userId), gameId)
			.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players));

		if (players.indexOf(null) === -1) {
			pipe = pipe
				.srem(Keys.PublicGames(), gameId)
				.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingSelection")
				.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), userId)
				.hset(Keys.ActiveGame(gameId), Fields.ControllingPlayer(), userId);
		}

		await pipe.exec();

		await this.publishPlayGame(gameId);
	}

	static async selectClue(gameId: string, userId: string, row: number, col: number): Promise<void> {
		await this.assertState(gameId, "AwaitingSelection");
		await this.assertUser(gameId, userId, "Active");

		const hash = await this.client.hmget(Keys.ActiveGame(gameId), Fields.Clue(row, col), Fields.Category(col), Fields.Value(row));

		if (!hash[0]) {
			throw new ValidationError("Clue already selected");
		}

		const activeClue: ActiveClueObject = JSON.parse(hash[0]);
		activeClue.category = hash[1]!;
		activeClue.value = Number.parseInt(hash[2]!);
		activeClue.alreadyGuessed = [];

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingAnswer")
			.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
			.hdel(Keys.ActiveGame(gameId), Fields.Clue(row, col))
			.hdel(Keys.ActiveGame(gameId), Fields.ActivePlayer())
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async buzzIn(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "ShowingAnswer");
		await this.assertUser(gameId, userId, "HaventGuessed");

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingResponse")
			.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), userId)
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async answerClue(gameId: string, userId: string, response: string): Promise<void> {
		await this.assertState(gameId, "AwaitingResponse");
		await this.assertUser(gameId, userId, "Active");

		const activeClue = await this.getActiveClue(gameId);
		const players = await this.getPlayers(gameId);

		activeClue.alreadyGuessed.push(userId);

		// Correct response
		if (this.responseCorrect(response, activeClue.question)) {
			players.forEach((player) => {
				if (player) {
					player.alreadyGuessed = false;

					if (player.id === userId) {
						player.score += activeClue.value;
					}
				}
			});

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingQuestion")
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.hset(Keys.ActiveGame(gameId), Fields.ControllingPlayer(), userId)
				.exec();

			// Everyone is wrong
		} else if (players.every((player) => !player || activeClue.alreadyGuessed.includes(player.id))) {
			players.forEach((player) => {
				if (player) {
					player.alreadyGuessed = false;

					if (player.id === userId) {
						player.score -= activeClue.value;
					}
				}
			});

			const controllingPlayer = (await this.client.hget(Keys.ActiveGame(gameId), Fields.ControllingPlayer()))!;
			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingQuestion")
				.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), controllingPlayer)
				.exec();

			// Someone hasn't guessed
		} else {
			players.forEach((player) => {
				if (player) {
					if (player.id === userId) {
						player.alreadyGuessed = true;
						player.score -= activeClue.value;
					}
				}
			});

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingAnswer")
				.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.hdel(Keys.ActiveGame(gameId), Fields.ActivePlayer())
				.exec();
		}

		await this.publishPlayGame(gameId);
	}

	static async closeClue(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "ShowingQuestion");
		await this.assertUser(gameId, userId, "Active");

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingSelection")
			.hdel(Keys.ActiveGame(gameId), Fields.ActiveClue())
			.exec();

		const game = await this.publishPlayGame(gameId);

		if (await this.isGameOver(gameId)) {
			let pipe = this.client.multi().srem(Keys.PublicGames(), gameId);
			game.players.forEach((player) => {
				if (player) {
					pipe = pipe.srem(Keys.UsersGames(player.id), gameId);
				}
			});
			pipe.del(Keys.ActiveGame(gameId)).exec();
		}
	}

	static async playGame(gameId: string, userId: string): Promise<GameObject> {
		await this.assertState(gameId, "Any");
		await this.assertUser(gameId, userId, "Any");

		return await this.getModel(gameId);
	}

	static async allGames(): Promise<GameObject[]> {
		return this.getModels(
			(await this.client.keys(Keys.ActiveGame("*"))).map((key) => {
				return key.split(":")[1]!;
			})
		);
	}

	static async usersGames(userId: string): Promise<GameObject[]> {
		return this.getModels(await this.client.smembers(Keys.UsersGames(userId)));
	}

	static async publicGames(userId: string): Promise<GameObject[]> {
		const publicGames = await this.client.smembers(Keys.PublicGames());

		const results = await Promise.all(
			publicGames.map(
				async (gameId): Promise<boolean> => {
					const players = await this.getPlayers(gameId);
					return !this.playersInclude(players, userId);
				}
			)
		);

		const filteredGames = publicGames.filter((_, index) => {
			return results[index];
		});

		return this.getModels(filteredGames);
	}

	static filterPlayGameSubs(): ResolverFn {
		return withFilter(
			() => Engine.pubsub.asyncIterator("PLAY_GAME"),
			async (
				{ playGame }: { playGame: GameObject },
				{ gameId }: { gameId: string },
				{ connection }: { connection: { context: TokenPayload } }
			) => {
				if (playGame.id !== gameId) {
					return false;
				}

				return this.playersInclude(playGame.players, connection.context.userId);
			}
		);
	}

	static async reset(): Promise<void> {
		await this.client.flushall();
	}
}
