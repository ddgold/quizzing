export type PlayerModels = (PlayerModel | null)[];

export interface PlayerModel {
	id: string;
	nickname: string;
	score: number;
}

export interface GameModel {
	id: string;
	name: string;
	categories: string[];
	rows: RowModel[];
	state: State;
	currentText?: string;
	activePlayer?: string;
	players: (PlayerModel | null)[];
	started: Date;
}

export interface RowModel {
	value: string;
	cols: boolean[];
}

export type State = "AwaitingPlayers" | "AwaitingSelection" | "ShowingAnswer" | "AwaitingResponse" | "ShowingQuestion";

export enum GameFilter {
	All,
	User,
	Public
}
