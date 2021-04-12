import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthenticationError, ForbiddenError } from "apollo-server-express";

import { UserModel } from "./database";
import { getDockerSecret } from "./environment";

export enum AccessLevel {
	User,
	Admin
}

export interface Context {
	req: Request;
	res: Response;
	payload?: TokenPayload;
}

interface ConnectionParams {
	authorization?: string;
	payload?: TokenPayload;
}

export interface TokenPayload {
	userId: string;
	access: AccessLevel;
}

export const signAccessToken = (payload: TokenPayload): string => {
	return sign(payload, getDockerSecret("access_token"), {
		expiresIn: "15m"
	});
};

export const signRefreshToken = (payload: TokenPayload): string => {
	return sign(payload, getDockerSecret("refresh_token"), {
		expiresIn: "7d"
	});
};

export const sendRefreshToken = (res: Response, refreshToken: string): void => {
	res.cookie("qid", refreshToken, {
		httpOnly: true,
		path: "/refreshToken"
	});
};

const assertToken = (accessToken: string | undefined, requiredAccess: AccessLevel): TokenPayload => {
	if (accessToken === undefined) {
		throw new AuthenticationError("Access token not provided");
	}

	let payload: TokenPayload;
	try {
		payload = verify(accessToken, getDockerSecret("access_token")) as TokenPayload;
	} catch (error) {
		throw new AuthenticationError("Not Authorized");
	}

	if (payload.access < requiredAccess) {
		throw new ForbiddenError("Access token does not have required access level");
	}

	return payload;
};

export const assertWsToken = (connectionParams: ConnectionParams, requiredAccess: AccessLevel): TokenPayload => {
	return assertToken(connectionParams.authorization, requiredAccess);
};

export const assertHttpToken = async (context: Context, requiredAccess: AccessLevel): Promise<void> => {
	context.payload = assertToken(context.req.headers["authorization"] && context.req.headers["authorization"].split(" ")[1], requiredAccess);
};

interface RefreshResult {
	success: boolean;
	accessToken: string;
}

export const postRefreshToken = async (req: Request, res: Response<RefreshResult>): Promise<Response<RefreshResult>> => {
	const refreshToken = req.cookies.qid;
	if (!refreshToken) {
		return res.send({ success: false, accessToken: "" });
	}

	try {
		const payload = verify(refreshToken, getDockerSecret("refresh_token")) as TokenPayload;

		const user = await UserModel.findById(payload.userId);
		if (!user) {
			return res.send({ success: false, accessToken: "" });
		}

		sendRefreshToken(res, signRefreshToken(user.tokenPayload()));
		return res.send({ success: true, accessToken: signAccessToken(user.tokenPayload()) });
	} catch (error) {
		console.error("Refresh token error:", error);
		return res.send({ success: false, accessToken: "" });
	}
};
