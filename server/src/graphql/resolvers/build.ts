import { IResolvers } from "graphql-tools";

import { BoardModel } from "../../database";

export const buildResolvers: IResolvers = {
	Query: {
		allBoards: async () => {
			return await BoardModel.find();
		},
		singleBoard: async (_, { id }) => {
			return await BoardModel.findOne({ _id: id });
		}
	},
	Mutation: {
		createNew: async (_, { name }) => {
			// Create new board
			try {
				const newBoard = await BoardModel.create({ name: name });
				return { board: newBoard };
			} catch (error) {
				console.log("Create New Board mutation error:", error);
				return { board: undefined, errors: [{ message: "Unknown error creating new board", field: "name" }] };
			}
		}
	}
};
