import { AccessLevel } from "../auth";

export interface UserObject {
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
	user: UserObject;
	errors: FieldError<Fields>[];
}
