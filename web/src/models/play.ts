export interface GameModel {
	categories: string[];
	rows: { value: number; cols: boolean[] }[];
	activeClue?: { text: string; showingAnswer: boolean };
}
