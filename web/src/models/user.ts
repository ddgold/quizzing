export interface User {
	id: string;
	nickname: string;
	email: string;
}

export interface FieldError<Fields> {
	field: Fields;
	message: string;
}

export interface AuthResult<Fields> {
	accessToken: string;
	user: User;
	errors: FieldError<Fields>[];
}
