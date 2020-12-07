export interface FieldError<Fields> {
	field: Fields;
	message: string;
}

export interface FormResult<Result, Fields> {
	result: Result;
	errors: FieldError<Fields>[];
}

export interface QueryError<Result> {
	result: Result;
	canEdit: Boolean;
}
