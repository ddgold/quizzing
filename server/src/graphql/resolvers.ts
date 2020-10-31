import { IResolvers } from "graphql-tools";

export const resolvers: IResolvers = {
	Query: {
		foo: () => {
			return "bar";
		}
	},
	Mutation: {
		login: (_, { email, password }) => {
			console.log(email, password);
			return email + "^" + password;
		},
		register: (_, { nickname, email, password }) => {
			console.log(nickname, email, password);
			return nickname + "^" + email + "^" + password;
		}
	}
};
