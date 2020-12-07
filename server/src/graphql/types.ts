export interface FieldError {
	field: string;
	message: string;
}

export interface FormResult<Result> {
	result?: Result;
	errors?: FieldError[];
}

export interface QueryResult<Result> {
	result: Result;
	canEdit: Boolean;
}
