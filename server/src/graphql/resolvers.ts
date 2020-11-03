import { IResolvers } from "graphql-tools";
import { UserModel } from "../database";

export const resolvers: IResolvers = {
	Query: {
		userByEmail: async (_, { email }) => {
			return await UserModel.findOne({ email: email });
		}
	},
	Mutation: {
		login: async (_, { email, password }) => {
			const user = await UserModel.findOne({ email: email });

			if (!user) {
				return { user: undefined, errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			if (user.password !== password) {
				return { user: undefined, errors: [{ message: "Incorrect email and/or password", field: "email" }] };
			}

			return { user: user };
		},
		register: async (_, { nickname, email, password }) => {
			if (await UserModel.findOne({ email: email })) {
				return { user: undefined, errors: [{ message: "Existing account using that email found", field: "email" }] };
			}

			try {
				const user = await UserModel.create({ nickname: nickname, email: email, password: password });
				return { user: user };
			} catch (error) {
				console.log("Register mutation error:", error);
				return { user: undefined, errors: [{ message: "Unknown error creating new account", field: "email" }] };
			}
		}
	}
};
