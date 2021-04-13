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
