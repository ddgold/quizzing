import { sign, verify } from "jsonwebtoken";
import { Request, Response } from "express";

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

export const assertAuthorized = (context: Context): void => {
	const authorization = context.req.headers["authorization"];

	if (!authorization) {
		throw new Error("Not Authorized");
	}

	try {
		const token = authorization.split(" ")[1];
		context.payload = verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
	} catch (error) {
		console.log("Authentication error:", error);
		throw new Error("Not Authorized");
	}
};

export const postRefreshToken = async (req: Request, res: Response): Promise<Response<any>> => {
	const token = req.cookies.qid;
	if (!token) {
		return res.send({ success: false, accessToken: "" });
	}

	try {
		const payload = verify(token, process.env.REFRESH_TOKEN_SECRET!) as TokenPayload;

		const user = await UserModel.findOne({ id: payload.userId });
		if (!user) {
			return res.send({ success: false });
		}

		sendRefreshToken(res, signRefreshToken(user.id));
		return res.send({ ok: true, accessToken: signAccessToken(user.id) });
	} catch (error) {
		console.log("Refresh token error:", error);
		return res.send({ success: false, accessToken: "" });
	}
};
