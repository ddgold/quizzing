export type PlayerArray = (PlayerObject | null)[];

export interface PlayerObject {
	id: string;
	nickname: string;
	score: number;
}

export interface GameObject {
	id: string;
	name: string;
	categories: string[];
	rows: RowObject[];
	state: State;
	currentText?: string;
	activePlayer?: string;
	players: PlayerArray;
	started: Date;
}

export interface RowObject {
	value: string;
	cols: boolean[];
}

export type State = "AwaitingPlayers" | "AwaitingSelection" | "ShowingAnswer" | "AwaitingResponse" | "ShowingQuestion";

export enum GameFilter {
	All,
	User,
	Public
}
