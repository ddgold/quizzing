import { ResolverFn, ValidationError, withFilter } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis, { Redis as RedisClient, RedisOptions } from "ioredis";
import { v4 as uuid } from "uuid";

import { BoardModel, CategoryDocument } from "../database";
import { ClueModel, Fields, GameModel, State, Keys, RowModel } from "./game";

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

	private static async getModel(gameId: string): Promise<GameModel> {
		const hash = await this.client.hgetall(Keys.ActiveGame(gameId));

		const [cols, rows] = hash[Fields.Size()]!.split("^").map((string) => {
			return Number.parseInt(string);
		}) as [number, number];

		let categories = Array<string>(cols).fill("");
		let models: RowModel[] = [];
		for (let row = 0; row < rows; row++) {
			let model: RowModel = { value: hash[Fields.Value(row)]!, cols: [] };
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
		if (state === "ShowingAnswer" || state === "ShowingQuestion") {
			const clueObject: ClueModel = JSON.parse(hash[Fields.ActiveClue()]!);
			if (state === "ShowingAnswer") {
				currentText = clueObject.answer;
			} else {
				currentText = clueObject.question;
			}
		}

		const model: GameModel = {
			id: gameId,
			name: hash[Fields.Name()]!,
			categories: categories,
			rows: models,
			state: state,
			currentText: currentText,
			started: new Date(hash[Fields.Started()]!)
		};

		return model;
	}

	private static async publishPlayGame(gameId: string): Promise<void> {
		this.pubsub.publish("PLAY_GAME", {
			playGame: await this.getModel(gameId)
		});
	}

	// --------------
	// Public Methods
	// --------------
	static async host(boardId: string, userId: string, cols: number = 6, rows: number = 5): Promise<string> {
		const gameId = uuid();
		await this.assertState(gameId, null);

		let board = await BoardModel.record(boardId);

		if (board.categories.length < cols) {
			throw new ValidationError(`Board '${board.name}' does not have at least ${cols} categories`);
		}

		const map = new Map<string, string>();
		map.set(Fields.Name(), board.name);
		map.set(Fields.Host(), userId);
		map.set(Fields.State(), "AwaitingSelection");
		map.set(Fields.Started(), new Date().toUTCString());
		map.set(Fields.Size(), `${cols}^${rows}`);

		for (let col = 0; col < cols; col++) {
			const randomIndex = Math.floor(Math.random() * board.categories.length);
			const category = board.categories.splice(randomIndex, 1)[0] as CategoryDocument;

			map.set(Fields.Category(col), category.name);

			const clues = await category.generateColumn(rows);
			for (let row = 0; row < clues.length; row++) {
				map.set(Fields.Clue(row, col), JSON.stringify(clues[row]));
			}
		}

		for (let row = 0; row < rows; row++) {
			map.set(Fields.Value(row), `${(row + 1) * 200}`);
		}

		await this.client.hset(Keys.ActiveGame(gameId), map);
		await this.join(gameId, userId);

		return gameId;
	}

	static async join(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "Any");

		this.client.sadd(Keys.UsersGames(userId), gameId);
	}

	static async selectClue(gameId: string, row: number, col: number): Promise<void> {
		await this.assertState(gameId, "AwaitingSelection");

		const clueString = await this.client.hget(Keys.ActiveGame(gameId), Fields.Clue(row, col));

		if (!clueString) {
			throw new ValidationError("Clue already selected");
		}

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingAnswer")
			.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), clueString)
			.hdel(Keys.ActiveGame(gameId), Fields.Clue(row, col))
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async answerClue(gameId: string): Promise<void> {
		await this.assertState(gameId, "ShowingAnswer");

		await this.client.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingQuestion");

		await this.publishPlayGame(gameId);
	}

	static async closeClue(gameId: string): Promise<void> {
		await this.assertState(gameId, "ShowingQuestion");

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingSelection")
			.hdel(Keys.ActiveGame(gameId), Fields.ActiveClue())
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async game(gameId: string): Promise<GameModel> {
		await this.assertState(gameId, "Any");

		const game: GameModel = await this.getModel(gameId);

		return game;
	}

	static async usersGames(userId: string): Promise<GameModel[]> {
		const gameIds = await this.client.smembers(Keys.UsersGames(userId));

		return Promise.all(
			gameIds.map((gameId) => {
				return this.game(gameId);
			})
		);
	}

	static filterPlayGameSubs(): ResolverFn {
		return withFilter(
			() => Engine.pubsub.asyncIterator("PLAY_GAME"),
			(payload: { playGame: GameModel }, variables: { gameId: string }) => {
				return payload.playGame.id === variables.gameId;
			}
		);
	}
}
