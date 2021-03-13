export interface RowModel {
	value: number;
	cols: boolean[];
}

export interface GameModel {
	categories: string[];
	rows: RowModel[];
}
