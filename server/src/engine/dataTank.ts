import { PubSub } from "apollo-server-express";

import { Game } from "./game";

class DataTank {
	private games: { [id: string]: Game } = {};

	readonly pubsub = new PubSub();

	host(id: string) {
		let game = this.games[id];
		if (game) {
			throw Error("Game already exists");
		}

		this.games[id] = new Game(id);
	}

	game(id: string): Game {
		let game = this.games[id];
		if (!game) {
			throw Error("Game not found");
		}

		return game;
	}
}

export const dataTank = new DataTank();

dataTank.host("KingKong");
dataTank.host("PingPong");
