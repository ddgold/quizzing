import { User } from "./user";

export interface BoardModel extends RecordModel {
	categories: CategoryModel[];
}

export interface CategoryModel extends RecordModel {
	format: CategoryFormat;
	clues: ClueModel[];
}

export interface ClueModel {
	question: string;
	answer: string;
}

export interface RecordModel {
	id: string;
	name: string;
	description: string;
	creator: User;
	created: Date;
	updated: Date;
}

export enum RecordType {
	Board = "BOARD",
	Category = "CATEGORY"
}

export enum CategoryFormat {
	Fix = "FIX",
	Random = "RANDOM",
	Sorted = "SORTED"
}
