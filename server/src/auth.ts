import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthenticationError, ValidationError } from "apollo-server-express";

import { UserModel } from "./database";
import { getDockerSecret } from "./environment";

export interface Context {
	req: Request;
	res: Response;
	payload?: TokenPayload;
}

interface ConnectionParams {
	authorization?: string;
	payload?: TokenPayload;
}

interface TokenPayload {
	userId: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
	return sign({ userId: payload.userId }, getDockerSecret("access_token"), {
		expiresIn: "15m"
	});
};

export const signRefreshToken = (payload: TokenPayload): string => {
	return sign({ userId: payload.userId }, getDockerSecret("refresh_token"), {
		expiresIn: "7d"
	});
};

export const sendRefreshToken = (res: Response, refreshToken: string): void => {
	res.cookie("qid", refreshToken, {
		httpOnly: true,
		path: "/refreshToken"
	});
};

const assertTokenAuthorized = (accessToken?: string): TokenPayload => {
	try {
		if (accessToken === undefined) {
			throw new ValidationError("Access token not provided");
		}
		return verify(accessToken, getDockerSecret("access_token")) as TokenPayload;
	} catch (error) {
		throw new AuthenticationError("Not Authorized");
	}
};

export const assertWsAuthorized = (connectionParams: ConnectionParams) => {
	connectionParams.payload = assertTokenAuthorized(connectionParams.authorization);
};

export const assertHttpAuthorized = async (context: Context): Promise<void> => {
	context.payload = assertTokenAuthorized(
		context.req.headers["authorization"] && context.req.headers["authorization"].split(" ")[1]
	);
};

interface RefreshResult {
	success: boolean;
	accessToken: string;
}

export const postRefreshToken = async (
	req: Request,
	res: Response<RefreshResult>
): Promise<Response<RefreshResult>> => {
	const refreshToken = req.cookies.qid;
	if (!refreshToken) {
		return res.send({ success: false, accessToken: "" });
	}

	try {
		const payload = verify(refreshToken, getDockerSecret("refresh_token")) as TokenPayload;

		const user = await UserModel.findOne({ _id: payload.userId });
		if (!user) {
			return res.send({ success: false, accessToken: "" });
		}

		sendRefreshToken(res, signRefreshToken({ userId: user.id }));
		return res.send({ success: true, accessToken: signAccessToken({ userId: user.id }) });
	} catch (error) {
		console.error("Refresh token error:", error);
		return res.send({ success: false, accessToken: "" });
	}
};
