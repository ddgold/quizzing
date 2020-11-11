import { User } from "./user";

export interface BoardModel {
	id: string;
	name: string;
	creator: User;
	created: Date;
}

export interface CategoryModel {
	id: string;
	name: string;
	description: string;
	clues: ClueModel[];
	creator: User;
	created: Date;
}

export interface ClueModel {
	id: string;
	question: string;
	answer: string;
}
