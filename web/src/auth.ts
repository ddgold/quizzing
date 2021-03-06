let accessToken = "";

export const setAccessToken = (newToken: string) => {
	accessToken = newToken;
};

export const getAccessToken = () => {
	return accessToken;
};

export enum AccessLevel {
	User,
	Admin
}

export interface TokenPayload {
	exp: number;
	iat: number;
	userId: string;
	access: AccessLevel;
}
