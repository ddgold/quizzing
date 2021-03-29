export namespace Keys {
	export const ActiveGame = (gameId: string): string => {
		return `activeGame:${gameId}`;
	};

	export const UsersGames = (userId: string): string => {
		return `usersGames:${userId}`;
	};
}

export namespace Fields {
	export const ActiveClue = () => {
		return "clue:active";
	};

	export const Category = (col: number) => {
		return `category:${col}`;
	};

	export const Size = () => {
		return "size";
	};

	export const Clue = (row: number, col: number): string => {
		return `clue:${row}^${col}`;
	};

	export const Host = () => {
		return "host";
	};

	export const Name = () => {
		return "name";
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

export interface ClueModel {
	answer: string;
	question: string;
}

export interface GameModel {
	id: string;
	name: string;
	categories: string[];
	rows: RowModel[];
	state: State;
	currentText?: string;
	started: Date;
}

export interface RowModel {
	value: string;
	cols: boolean[];
}

export type State = "AwaitingSelection" | "ShowingAnswer" | "ShowingQuestion";
