import { dataTank } from "./dataTank";

export interface GameModel {
	id: string;
	name: string;
	categories: string[];
	rows: { value: number; cols: boolean[] }[];
	activeClue?: { text: string; showingAnswer: boolean };
	started: Date;
}

export interface ClueModel {
	answer: string;
	question: string;
}

enum State {
	AwaitingSelection,
	ShowingAnswer,
	ShowingQuestion
}

export class Game {
	private state: State;
	private _model: GameModel;
	private _clues: ClueModel[][];
	private _active: ClueModel | undefined;

	constructor(model: GameModel, clues: ClueModel[][]) {
		this.state = State.AwaitingSelection;
		this._model = model;
		this._clues = clues;
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

		this._active = this._clues[col][row];
		this.model.activeClue = { text: this._active.answer, showingAnswer: true };
		this.state = State.ShowingAnswer;

		this.publish();
	}

	answerClue(): void {
		if (this.state !== State.ShowingAnswer) {
			throw new Error("Incorrect state");
		}

		this.model.activeClue = { text: this._active.question, showingAnswer: false };
		this.state = State.ShowingQuestion;

		this.publish();
	}

	closeClue(): void {
		if (this.state !== State.ShowingQuestion) {
			throw new Error("Incorrect state");
		}

		this._active = undefined;
		this.model.activeClue = undefined;
		this.state = State.AwaitingSelection;

		this.publish();
	}
}
