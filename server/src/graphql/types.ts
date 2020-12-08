import { BoardDocument, CategoryDocument } from "src/database";

export type ResultObject = BoardDocument | CategoryDocument;

export interface FieldError {
	field: string;
	message: string;
}

export interface FormResult<Result extends ResultObject> {
	result?: Result;
	errors?: FieldError[];
}

export interface QueryResult<Result extends ResultObject> {
	result?: Result;
	canEdit?: Boolean;
}
