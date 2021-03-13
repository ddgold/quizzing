import { PubSub, withFilter } from "apollo-server-express";
import { IResolvers } from "graphql-tools";

import { Context } from "../../auth";

const pubsub = new PubSub();

export const PlayResolvers: IResolvers<any, Context> = {
	Subscription: {
		playGame: {
			subscribe: withFilter(
				() => pubsub.asyncIterator("PLAY_GAME"),
				(payload, variables) => {
					return payload.boardId === variables.id;
				}
			)
		}
	}
};

export interface RowModel {
	value: number;
	cols: boolean[];
}

export interface GameModel {
	categories: string[];
	rows: RowModel[];
}

class GameObject {
	readonly boardId: string;
	private _model: GameModel;

	constructor(boardId: string) {
		this.boardId = boardId;

		this._model = {
			categories: [
				"Hello World",
				"A Slightly Longer Title",
				"King Kong",
				"This Title is Just Plain Too Long, What Will Happen When The Title is Too Long?",
				"Ping",
				"Pong"
			],
			rows: [
				{ cols: [false, false, false, false, false, false], value: 200 },
				{ cols: [true, false, false, false, false, false], value: 400 },
				{ cols: [false, false, false, true, false, false], value: 600 },
				{ cols: [false, true, false, false, false, false], value: 800 },
				{ cols: [false, false, false, false, false, false], value: 1000 }
			]
		};

		setInterval(() => {
			this.random();
			pubsub.publish("PLAY_GAME", {
				boardId: boardId,
				playGame: this._model
			});
		}, 600);
	}

	random() {
		const row = Math.floor(Math.random() * this._model.rows.length);
		const col = Math.floor(Math.random() * this._model.rows[row].cols.length);
		this._model.rows[row].cols[col] = !this._model.rows[row].cols[col];
	}
}

const games = [new GameObject("KingKong"), new GameObject("PingPong")];
