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
