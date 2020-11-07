import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthenticationError } from "apollo-server-express";

import { UserModel } from "./database";

export interface Context {
	req: Request;
	res: Response;
	payload?: { userId: string };
}

interface TokenPayload {
	userId: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
	return sign({ userId: payload.userId }, process.env.ACCESS_TOKEN_SECRET!, {
		expiresIn: "15m"
	});
};

export const signRefreshToken = (payload: TokenPayload): string => {
	return sign({ userId: payload.userId }, process.env.REFRESH_TOKEN_SECRET!, {
		expiresIn: "7d"
	});
};

export const sendRefreshToken = (res: Response, token: string): void => {
	res.cookie("qid", token, {
		httpOnly: true,
		path: "/refreshToken"
	});
};

export const assertAuthorized = async (context: Context): Promise<void> => {
	const authorization = context.req.headers["authorization"];

	if (!authorization) {
		throw new AuthenticationError("Not Authorized");
	}

	try {
		const token = authorization.split(" ")[1];
		context.payload = verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
	} catch (error) {
		console.log(`Authentication error: ${error}`);
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
	const token = req.cookies.qid;
	if (!token) {
		return res.send({ success: false, accessToken: "" });
	}

	try {
		const payload = verify(token, process.env.REFRESH_TOKEN_SECRET!) as TokenPayload;

		const user = await UserModel.findOne({ _id: payload.userId });
		if (!user) {
			return res.send({ success: false, accessToken: "" });
		}

		sendRefreshToken(res, signRefreshToken({ userId: user.id }));
		return res.send({ success: true, accessToken: signAccessToken({ userId: user.id }) });
	} catch (error) {
		console.log("Refresh token error:", error);
		return res.send({ success: false, accessToken: "" });
	}
};
