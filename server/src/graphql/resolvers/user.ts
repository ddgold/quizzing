import { IResolvers } from "graphql-tools";

import { User, UserDocument, UserModel } from "../../database";
import { Context, assertAuthorized, sendRefreshToken, signAccessToken, signRefreshToken } from "../../auth";

interface AuthResult {
	accessToken?: string;
	user?: UserDocument;
	errors?: { message: string; field: string }[];
}

export const userResolvers: IResolvers<any, Context> = {
	Query: {
		currentUser: async (_, {}, context): Promise<User> => {
			try {
				await assertAuthorized(context);
				return await UserModel.findById(context.payload!.userId).exec();
			} catch (error) {
				return null;
			}
		},
		userByEmail: async (_, { email }, context): Promise<User> => {
			await assertAuthorized(context);
			return await UserModel.findOne({ email: email }).exec();
		}
	},
	Mutation: {
		login: async (_, { email, password }, context): Promise<AuthResult> => {
			// Check user with email exists
			const user = await UserModel.findOne({ email: email }).exec();
			if (!user) {
				return { errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			// Check user's password was correct
			const valid = await user.comparePassword(password);
			if (!valid) {
				return { errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			// Update user's last login date
			user.lastLogin = new Date();
			await user.save();

			// Return user
			sendRefreshToken(context.res, signRefreshToken({ userId: user.id }));
			return { accessToken: signAccessToken({ userId: user.id }), user: user };
		},
		logout: async (_, {}, context): Promise<boolean> => {
			// Clear refresh token
			sendRefreshToken(context.res, "");
			return true;
		},
		register: async (_, { nickname, email, password }, context): Promise<AuthResult> => {
			let errors = [];
			// Check there's no existing user using this nickname
			if (await UserModel.findOne({ nickname: nickname }).exec()) {
				errors.push({ message: "Existing account using that nickname found", field: "nickname" });
			}

			// Check there's no existing user using this email
			if (await UserModel.findOne({ email: email }).exec()) {
				errors.push({ message: "Existing account using that email found", field: "email" });
			}

			// Return any errors
			if (errors.length) {
				return { errors: errors };
			}

			// Create new user
			try {
				const newUser = await UserModel.create({ nickname: nickname, email: email, password: password });

				// Return new user
				sendRefreshToken(context.res, signRefreshToken({ userId: newUser.id }));
				return { accessToken: signAccessToken({ userId: newUser.id }), user: newUser };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Register mutation error: ${error.message}`);
						break;
					default:
						console.log("Register mutation unknown error:", error);
				}
				return { errors: [{ message: "Error creating new account", field: "email" }] };
			}
		}
	}
};
