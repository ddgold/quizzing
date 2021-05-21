export interface ActiveClueObject {
	answer: string;
	question: string;
	category: string;
	value: number;
	protestTally?: number;
}

export type PlayerArray = (PlayerObject | null)[];

export interface PlayerObject {
	id: string;
	nickname: string;
	alreadyActed: boolean;
	score: number;
}

export interface GameObject {
	id: string;
	name: string;
	categories: string[];
	rows: RowObject[];
	state: State;
	timeout?: number;
	currentText?: string;
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
	| "VerifyingResult"
	| "ShowingVerifiedResult";

export enum GameFilter {
	All,
	User,
	Public
}
