import { User } from "./user";

export interface BoardModel {
	id: string;
	name: string;
	description: string;
	categories: CategoryModel[];
	creator: User;
	created: Date;
	updated: Date;
}

export interface CategoryModel {
	id: string;
	name: string;
	description: string;
	clues: ClueModel[];
	creator: User;
	created: Date;
	updated: Date;
}

export interface ClueModel {
	question: string;
	answer: string;
}

export type Record = BoardModel | CategoryModel;

export type RecordType = "Board" | "Category";
