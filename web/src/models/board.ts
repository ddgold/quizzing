export interface BoardModel {
	id: string;
	name: string;
	created: Date;
}

export interface FieldError<Fields> {
	field: Fields;
	message: string;
}

export interface BoardResult<Fields> {
	board: BoardModel;
	errors: FieldError<Fields>[];
}
