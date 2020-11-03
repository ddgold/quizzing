import { IResolvers } from "graphql-tools";

import { UserModel } from "../../database";

export const authResolvers: IResolvers = {
	Query: {
		userByEmail: async (_, { email }) => {
			return await UserModel.findOne({ email: email });
		}
	},
	Mutation: {
		login: async (_, { email, password }) => {
			// Check user with email exists
			const user = await UserModel.findOne({ email: email });
			if (!user) {
				return { user: undefined, errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			// Check user's password was correct
			const valid = await user.comparePassword(password);
			if (!valid) {
				return { user: undefined, errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			// Update user's last login date
			user.lastLogin = new Date();
			await user.save();

			// Return user
			return { user: user };
		},
		register: async (_, { nickname, email, password }) => {
			let errors = [];
			// Check there's no existing user using this nickname
			if (await UserModel.findOne({ nickname: nickname })) {
				errors.push({ message: "Existing account using that nickname found", field: "nickname" });
			}

			// Check there's no existing user using this email
			if (await UserModel.findOne({ email: email })) {
				errors.push({ message: "Existing account using that email found", field: "email" });
			}

			// Return any errors
			if (errors.length) {
				return { user: undefined, errors: errors };
			}

			// Create new user
			try {
				const newUser = await UserModel.create({ nickname: nickname, email: email, password: password });
				return { user: newUser };
			} catch (error) {
				console.log("Register mutation error:", error);
				return { user: undefined, errors: [{ message: "Unknown error creating new account", field: "email" }] };
			}
		}
	}
};
