import { AccessLevel } from "../auth";

export interface UserModel {
	id: string;
	nickname: string;
	email: string;
	access: AccessLevel;
}

export interface FieldError<Fields> {
	field: Fields;
	message: string;
}

export interface AuthResult<Fields> {
	accessToken: string;
	user: UserModel;
	errors: FieldError<Fields>[];
}
