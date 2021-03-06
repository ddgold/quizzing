import { ForbiddenError, ResolverFn, ValidationError, withFilter } from "apollo-server-express";
import axios from "axios";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis, { Redis as RedisClient, RedisOptions } from "ioredis";
import { v4 as uuid } from "uuid";

import { TokenPayload } from "../auth";
import { BoardModel, CategoryDocument, UserModel } from "../database";
import { getDockerSecret, getEnvironmentVariable, slowModeOn } from "../environment";
import { Fields, Keys } from "./game";
import { ActiveClueObject, GameObject, State, RowObject, PlayerArray, ResultObject } from "../objects/play";

interface JudgeResponse {
	answer: string;
	guess: string;
	result: boolean;
}

export default class Engine {
	// --------
	// Instance
	// --------
	private client: RedisClient;
	private pubsub: RedisPubSub;
	private timeouts: { [gameId: string]: number };

	private constructor(options: RedisOptions) {
		this.pubsub = new RedisPubSub({
			publisher: new Redis(options),
			subscriber: new Redis(options)
		});
		this.client = new Redis(options);
		this.timeouts = {};
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

	private static timeouts(gameId: string): number | undefined {
		if (this.singleton === undefined) {
			throw new Error("Engine cache not connected");
		}

		return this.singleton.timeouts[gameId];
	}

	static async connect(url: string): Promise<string> {
		if (this.singleton !== undefined) {
			throw new Error("Engine cache already connected");
		}

		if (!/^redis:\/\/\S+:\d+\/?$/.test(url)) {
			throw new Error(`Invalid engine url '${url}'`);
		}

		let split = url.split("redis://")[1]!.split(":");
		this.singleton = new Engine({ host: split[0]!, port: Number.parseInt(split[1]!) });
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
	private static async assertState(gameId: string, requiredState: State | State[] | "Any" | null): Promise<void> {
		const currentState = await this.client.hget(Keys.ActiveGame(gameId), Fields.State());
		if (currentState === null && requiredState !== null) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		} else if (currentState !== null && requiredState === null) {
			throw new ValidationError(`Game with id '${gameId}' already exists`);
		} else if (requiredState !== "Any") {
			if (requiredState === null || typeof requiredState === "string") {
				if (currentState === requiredState) {
					return;
				}
			} else {
				for (const state of requiredState) {
					if (currentState === state) {
						return;
					}
				}
			}
			throw new ValidationError(`Game with id '${gameId}' found state '${currentState}' expecting '${requiredState}'`);
		}
	}

	private static async assertUser(gameId: string, userId: string, limit: "Any" | "Active" | "HaventActed"): Promise<void> {
		if (limit === "Active") {
			const activePlayer = await this.client.hget(Keys.ActiveGame(gameId), Fields.ActivePlayer());
			if (!activePlayer || activePlayer !== userId) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}
		} else if (limit === "Any") {
			const players = await this.getPlayers(gameId);
			if (!this.playersInclude(players, userId)) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}
		} else if (limit === "HaventActed") {
			const players = await this.getPlayers(gameId);
			for (const player of players) {
				if (player && player.id === userId) {
					if (player.alreadyActed) {
						break;
					}
					return;
				}
			}

			throw new ForbiddenError(`Can't access game with id '${gameId}'`);
		}
	}

	private static async checkTimeout(gameId: string, timeout: string): Promise<boolean> {
		const cache = await this.client.hget(Keys.ActiveGame(gameId), Fields.Timeout());
		return !!cache && timeout === cache;
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

		let timeout: string | undefined;
		if (hash[Fields.Timeout()]) {
			timeout = hash[Fields.Timeout()]!;
		}

		const state = hash[Fields.State()] as State;
		let currentText: string | undefined;
		let results: ResultObject[] | undefined;
		if (state === "ShowingClue" || state === "AwaitingResponse") {
			const activeClue: ActiveClueObject = JSON.parse(hash[Fields.ActiveClue()]!);
			currentText = activeClue.answer;
		} else if (state === "ShowingResult" || state === "AwaitingProtest") {
			const activeClue: ActiveClueObject = JSON.parse(hash[Fields.ActiveClue()]!);
			currentText = activeClue.question;
			results = activeClue.results;
		} else if (state === "VotingOnProtest") {
			const activeClue: ActiveClueObject = JSON.parse(hash[Fields.ActiveClue()]!);
			currentText = activeClue.question;
			results = [activeClue.results[activeClue.currentProtest!]!];
		}

		const model: GameObject = {
			id: gameId,
			name: hash[Fields.Name()]!,
			categories: categories,
			rows: models,
			state: state,
			timeout: timeout,
			currentText: currentText,
			results: results,
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
		const activeClue = await this.client.hget(Keys.ActiveGame(gameId), Fields.ActiveClue());
		if (activeClue === null) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		}

		return JSON.parse(activeClue);
	}

	private static async getPlayers(gameId: string): Promise<PlayerArray> {
		const players = await this.client.hget(Keys.ActiveGame(gameId), Fields.Players());
		if (players === null) {
			throw new ValidationError(`Game with id '${gameId}' does not exist`);
		}

		return JSON.parse(players);
	}

	private static playersInclude(players: PlayerArray, targetId: string): boolean {
		return players.some((player) => {
			return player && player.id === targetId;
		});
	}

	private static async judgeResponse(answer: string, guess: string): Promise<boolean> {
		try {
			const response = await axios.post<JudgeResponse>(
				`${getEnvironmentVariable("JUDGE_URL")}/judge`,
				{
					answer: answer,
					guess: guess
				},
				{
					headers: { Authorization: `Bearer ${getDockerSecret("judge_token")}` }
				}
			);

			return response.data.result;
		} catch (error) {
			console.error("Error judging response", error);
			throw error;
		}
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

	// --------
	// Timeouts
	// --------
	private static timeout(gameId: string, ms: number, callback: () => {}): string {
		const oldTimeout = this.timeouts(gameId);
		if (oldTimeout) {
			clearTimeout(oldTimeout);
		}

		if (slowModeOn()) {
			ms = ms * 10;
		}

		const newTimeout = `${Date.now() + ms}^${ms}`;
		setTimeout(
			(async () => {
				if (!(await this.checkTimeout(gameId, newTimeout))) {
					return;
				}

				callback();
			}).bind(this),
			ms + 200
		);

		return newTimeout;
	}

	private static awaitingSelectionTimeout(gameId: string): string {
		return this.timeout(gameId, 5000, async () => {
			await this.assertState(gameId, "AwaitingSelection");

			// TODO: for now just select a random user, need to refine this
			const players = await this.getPlayers(gameId);
			const activePlayer = (await this.client.hget(Keys.ActiveGame(gameId), Fields.ActivePlayer()))!;
			let done = false;
			do {
				const newActive = players[Math.floor(Math.random() * players.length)];
				if (!newActive || newActive.id === activePlayer) {
					continue;
				}

				await this.client
					.multi()
					.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.awaitingSelectionTimeout(gameId))
					.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), newActive.id)
					.exec();

				await this.publishPlayGame(gameId);

				done = true;
			} while (!done);
		});
	}

	private static showingClueTimeout(gameId: string): string {
		return this.timeout(gameId, 10000, async () => {
			await this.assertState(gameId, "ShowingClue");

			const controllingPlayer = (await this.client.hget(Keys.ActiveGame(gameId), Fields.ControllingPlayer()))!;
			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
				.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), controllingPlayer)
				.exec();

			await this.publishPlayGame(gameId);
		});
	}

	private static awaitingResponseTimeout(gameId: string, userId: string): string {
		return this.timeout(gameId, 10000, async () => {
			await this.answerClue(gameId, userId, "");
		});
	}

	private static showingResultTimeout(gameId: string): string {
		return this.timeout(gameId, 5000, async () => {
			await this.assertState(gameId, "ShowingResult");

			const players = await this.getPlayers(gameId);
			for (const player of players) {
				if (player) {
					player.alreadyActed = false;
				}
			}

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingSelection")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.awaitingSelectionTimeout(gameId))
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.hdel(Keys.ActiveGame(gameId), Fields.ActiveClue())
				.exec();

			const game = await this.publishPlayGame(gameId);

			if (await this.isGameOver(gameId)) {
				let pipe = this.client.multi().srem(Keys.PublicGames(), gameId);
				for (const player of game.players) {
					if (player) {
						pipe = pipe.srem(Keys.UsersGames(player.id), gameId);
					}
				}
				pipe.del(Keys.ActiveGame(gameId)).exec();
			}
		});
	}

	private static awaitingProtestTimeout(gameId: string): string {
		return this.timeout(gameId, 5000, async () => {
			await this.assertState(gameId, "AwaitingProtest");

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
				.exec();

			await this.publishPlayGame(gameId);
		});
	}

	private static votingOnProtestTimeout(gameId: string): string {
		return this.timeout(gameId, 5000, async () => {
			await this.assertState(gameId, "VotingOnProtest");

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
				.exec();

			await this.publishPlayGame(gameId);
		});
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
			alreadyActed: false,
			score: 0
		};

		let pipe = this.client
			.multi()
			.sadd(Keys.UsersGames(userId), gameId)
			.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players));

		if (players.indexOf(null) === -1) {
			await pipe
				.srem(Keys.PublicGames(), gameId)
				.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingSelection")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.awaitingSelectionTimeout(gameId))
				.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), userId)
				.hset(Keys.ActiveGame(gameId), Fields.ControllingPlayer(), userId)
				.exec();
		} else {
			await pipe.exec();
		}

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
		activeClue.results = [];

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingClue")
			.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingClueTimeout(gameId))
			.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
			.hdel(Keys.ActiveGame(gameId), Fields.Clue(row, col))
			.hdel(Keys.ActiveGame(gameId), Fields.ActivePlayer())
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async buzzIn(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "ShowingClue");
		await this.assertUser(gameId, userId, "HaventActed");

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingResponse")
			.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.awaitingResponseTimeout(gameId, userId))
			.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), userId)
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async answerClue(gameId: string, userId: string, response: string): Promise<void> {
		await this.assertState(gameId, "AwaitingResponse");
		await this.assertUser(gameId, userId, "Active");

		const activeClue = await this.getActiveClue(gameId);

		// Correct response
		if (response.length > 0 && (await this.judgeResponse(activeClue.question, response))) {
			activeClue.results.push({ playerId: userId, response: response, correct: true, protested: false });

			const players = await this.getPlayers(gameId);
			for (const player of players) {
				if (player && player.id === userId) {
					player.alreadyActed = true;
					player.score += activeClue.value;
					break;
				}
			}

			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
				.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
				.hset(Keys.ActiveGame(gameId), Fields.ControllingPlayer(), userId)
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.exec();
		}
		// Wrong response
		else {
			activeClue.results.push({ playerId: userId, response: response, correct: false, protested: false });

			const players = await this.getPlayers(gameId);
			for (const player of players) {
				if (player && player.id === userId) {
					player.alreadyActed = true;
					player.score -= activeClue.value;
					break;
				}
			}

			// Everyone is wrong
			if (players.every((player) => !player || player.alreadyActed)) {
				const controllingPlayer = (await this.client.hget(Keys.ActiveGame(gameId), Fields.ControllingPlayer()))!;
				await this.client
					.multi()
					.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
					.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
					.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
					.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
					.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), controllingPlayer)
					.exec();
			}
			// Someone hasn't guessed
			else {
				await this.client
					.multi()
					.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingClue")
					.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingClueTimeout(gameId))
					.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
					.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
					.hdel(Keys.ActiveGame(gameId), Fields.ActivePlayer())
					.exec();
			}
		}

		await this.publishPlayGame(gameId);
	}

	static async protestResult(gameId: string, userId: string): Promise<void> {
		await this.assertState(gameId, "ShowingResult");
		await this.assertUser(gameId, userId, "Any");

		const activeClue = await this.getActiveClue(gameId);
		if (activeClue.results.length === 0) {
			throw new ValidationError("No results to protest");
		}

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "AwaitingProtest")
			.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.awaitingProtestTimeout(gameId))
			.hset(Keys.ActiveGame(gameId), Fields.ActivePlayer(), userId)
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async selectProtest(gameId: string, userId: string, index: number) {
		await this.assertState(gameId, "AwaitingProtest");
		await this.assertUser(gameId, userId, "Active");

		const activeClue = await this.getActiveClue(gameId);
		if (index > activeClue.results.length || activeClue.results[index]!.protested) {
			throw new ValidationError("Invalid result index");
		}

		activeClue.currentProtest = index;
		activeClue.results[index]!.protested = true;
		activeClue.protestTally = 0;

		const players = await this.getPlayers(gameId);
		for (const player of players) {
			if (player) {
				player.alreadyActed = false;
			}
		}

		await this.client
			.multi()
			.hset(Keys.ActiveGame(gameId), Fields.State(), "VotingOnProtest")
			.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.votingOnProtestTimeout(gameId))
			.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
			.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
			.exec();

		await this.publishPlayGame(gameId);
	}

	static async voteOnProtest(gameId: string, userId: string, vote: boolean) {
		await this.assertState(gameId, "VotingOnProtest");
		await this.assertUser(gameId, userId, "HaventActed");

		const activeClue = await this.getActiveClue(gameId);
		activeClue.protestTally! += vote ? 1 : -1;

		const players = await this.getPlayers(gameId);
		for (const player of players) {
			if (player && player.id === userId) {
				player.alreadyActed = true;
				break;
			}
		}

		// Done voting
		if (players.every((player) => !player || player.alreadyActed)) {
			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.State(), "ShowingResult")
				.hset(Keys.ActiveGame(gameId), Fields.Timeout(), this.showingResultTimeout(gameId))
				.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.exec();
		}
		// Someone hasn't voted
		else {
			await this.client
				.multi()
				.hset(Keys.ActiveGame(gameId), Fields.ActiveClue(), JSON.stringify(activeClue))
				.hset(Keys.ActiveGame(gameId), Fields.Players(), JSON.stringify(players))
				.exec();
		}

		await this.publishPlayGame(gameId);
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
			publicGames.map(async (gameId): Promise<boolean> => {
				const players = await this.getPlayers(gameId);
				return !this.playersInclude(players, userId);
			})
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
