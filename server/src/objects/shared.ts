export interface FieldError<Fields> {
	field: Fields;
	message: string;
}

export interface FormResult<Result, Fields> {
	result?: Result;
	errors?: FieldError<Fields>[];
}

export interface QueryResult<Result> {
	result?: Result;
	canEdit?: Boolean;
}

export interface SearchResult<Result> {
	result?: Result[];
}
