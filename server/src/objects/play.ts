export interface ActiveClueObject {
	answer: string;
	question: string;
	category: string;
	value: number;
	results: ResultObject[];
	currentProtest?: number;
	protestTally?: number;
}

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
	timeout?: number;
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
