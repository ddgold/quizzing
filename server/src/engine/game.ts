import { dataTank } from "./dataTank";

export interface GameModel {
	categories: string[];
	rows: { value: number; cols: boolean[] }[];
	activeClue?: { text: string; showingAnswer: boolean };
}

enum State {
	AwaitingSelection,
	ShowingAnswer,
	ShowingQuestion
}

export class Game {
	readonly boardId: string;
	private state: State;
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
				{ cols: [false, false, false, false, false, false], value: 400 },
				{ cols: [false, false, false, false, false, false], value: 600 },
				{ cols: [false, false, false, false, false, false], value: 800 },
				{ cols: [false, false, false, false, false, false], value: 1000 }
			]
		};

		this.state = State.AwaitingSelection;
	}

	get rows(): number {
		return this.model.rows.length;
	}

	get cols(): number {
		return this.model.rows[0].cols.length;
	}

	get model(): GameModel {
		return this._model;
	}

	private publish(): void {
		dataTank.pubsub.publish("PLAY_GAME", {
			boardId: this.boardId,
			playGame: this.model
		});
	}

	private selected(row: number, col: number): boolean {
		return this.model.rows[row].cols[col];
	}

	private completed(col: number): boolean {
		for (let row = 0; row < this.rows; row++) {
			if (!this.selected(row, col)) {
				return false;
			}
		}
		return true;
	}

	selectClue(row: number, col: number): void {
		if (this.state !== State.AwaitingSelection) {
			throw new Error("Incorrect state");
		}

		if (this.selected(row, col)) {
			throw new Error("Clue already selected");
		}

		this.model.rows[row].cols[col] = true;
		if (this.completed(col)) {
			this.model.categories[col] = "";
		}

		this.model.activeClue = { text: `Row: ${row}, Col: ${col}`, showingAnswer: true };
		this.state = State.ShowingAnswer;

		this.publish();
	}

	answerClue(): void {
		if (this.state !== State.ShowingAnswer) {
			throw new Error("Incorrect state");
		}

		this.model.activeClue = { text: this.model.activeClue.text, showingAnswer: false };
		this.state = State.ShowingQuestion;

		this.publish();
	}

	closeClue(): void {
		if (this.state !== State.ShowingQuestion) {
			throw new Error("Incorrect state");
		}

		this.model.activeClue = undefined;
		this.state = State.AwaitingSelection;

		this.publish();
	}
}
