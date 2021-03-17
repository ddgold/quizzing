export interface GameModel {
	id: string;
	name: string;
	categories: string[];
	rows: { value: number; cols: boolean[] }[];
	activeClue?: { text: string; showingAnswer: boolean };
	started: Date;
}
