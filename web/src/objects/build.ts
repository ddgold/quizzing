import { UserObject } from "./user";

export interface BoardObject extends RecordObject {
	categories: CategoryObject[];
}

export interface CategoryObject extends RecordObject {
	format: CategoryFormat;
	clues: ClueObject[];
}

export interface ClueObject {
	question: string;
	answer: string;
}

export interface RecordObject {
	id: string;
	name: string;
	description: string;
	creator: UserObject;
	created: Date;
	updated: Date;
}

export enum RecordType {
	Board = "BOARD",
	Category = "CATEGORY"
}

export const getRecordTypeName = (type: RecordType, options?: Partial<{ lowerCase: boolean; plural: boolean }>): string => {
	let name: string;
	switch (type) {
		case RecordType.Board:
			name = options?.plural ? "Boards" : "Board";
			break;
		case RecordType.Category:
			name = options?.plural ? "Categories" : "Category";
			break;
	}

	if (options?.lowerCase) {
		name = name.toLowerCase();
	}

	return name;
};

export enum CategoryFormat {
	Fix = "FIX",
	Random = "RANDOM",
	Sorted = "SORTED"
}
