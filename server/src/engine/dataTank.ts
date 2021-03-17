import { PubSub } from "apollo-server-express";

import { BoardModel } from "../database";
import { Game } from "./game";

class DataTank {
	private _games: { [id: string]: Game } = {};

	readonly pubsub = new PubSub();

	async host(boardId: string): Promise<string> {
		const [model, clues] = await BoardModel.generateGame(boardId);
		const game = new Game(model, clues);
		this._games[model.id] = game;
		return model.id;
	}

	games(): Game[] {
		return Object.values(this._games);
	}

	game(gameId: string): Game {
		let game = this._games[gameId];
		if (!game) {
			throw Error("Game not found");
		}
		return game;
	}
}

export const dataTank = new DataTank();
