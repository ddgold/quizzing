export type PlayerArray = (PlayerObject | null)[];

export interface PlayerObject {
	id: string;
	nickname: string;
	alreadyActed: boolean;
	score: number;
}

export interface ResultObject {
	playerId: string;
	response: string;
	correct: boolean;
	protested: boolean;
}

export interface GameObject {
	id: string;
	name: string;
	categories: string[];
	rows: RowObject[];
	state: State;
	timeout?: string;
	currentText?: string;
	results?: ResultObject[];
	activePlayer?: string;
	players: PlayerArray;
	started: Date;
}

export interface RowObject {
	value: string;
	cols: boolean[];
}

export type State =
	| "AwaitingPlayers"
	| "AwaitingSelection"
	| "ShowingClue"
	| "AwaitingResponse"
	| "ShowingResult"
	| "AwaitingProtest"
	| "VotingOnProtest";

export enum GameFilter {
	All,
	User,
	Public
}
