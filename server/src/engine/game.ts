export namespace Keys {
	export const ActiveGame = (gameId: string): string => {
		return `activeGame:${gameId}`;
	};

	export const UsersGames = (userId: string): string => {
		return `usersGames:${userId}`;
	};

	export const PublicGames = (): string => {
		return `publicGames`;
	};
}

export namespace Fields {
	export const ActiveClue = () => {
		return "activeClue";
	};

	export const ActivePlayer = () => {
		return "activePlayer";
	};

	export const Category = (col: number) => {
		return `category:${col}`;
	};

	export const Clue = (row: number | "*", col: number | "*"): string => {
		return `clue:${row}^${col}`;
	};

	export const Host = () => {
		return "host";
	};

	export const Name = () => {
		return "name";
	};

	export const Players = () => {
		return "players";
	};

	export const Size = () => {
		return "size";
	};

	export const State = () => {
		return "state";
	};

	export const Started = () => {
		return "started";
	};

	export const Value = (row: number) => {
		return `value:${row}`;
	};
}

export interface ClueObject {
	answer: string;
	question: string;
	category: string;
	value: number;
}

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
