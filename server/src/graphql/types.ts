import { RecordDocument } from "../database";

export interface FieldError {
	field: string;
	message: string;
}

export interface FormResult<Result extends RecordDocument> {
	result?: Result;
	errors?: FieldError[];
}

export interface QueryResult<Result extends RecordDocument> {
	result?: Result;
	canEdit?: Boolean;
}

export interface SearchResult<Result extends RecordDocument> {
	result?: Result[];
}
