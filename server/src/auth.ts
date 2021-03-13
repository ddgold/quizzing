import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthenticationError } from "apollo-server-express";

import { UserModel } from "./database";
import { getDockerSecret } from "./environment";

export interface Context {
	req: Request;
	res: Response;
	payload?: { userId: string };
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

export const assertWsAuthorized = (accessToken: string) => {
	try {
		verify(accessToken, getDockerSecret("access_token"));
	} catch (error) {
		console.error(`Authorization error: ${error}`);
		throw new AuthenticationError("Not Authorized");
	}
};

export const assertHttpAuthorized = async (context: Context): Promise<void> => {
	try {
		const accessToken = context.req.headers["authorization"].split(" ")[1];
		context.payload = verify(accessToken, getDockerSecret("access_token")) as TokenPayload;
	} catch (error) {
		console.error(`Authorization error: ${error}`);
		throw new AuthenticationError("Not Authorized");
	}
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
