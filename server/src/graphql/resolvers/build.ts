import { IResolvers } from "graphql-tools";

import { Board, BoardModel } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const buildResolvers: IResolvers<any, Context> = {
	Query: {
		allBoards: async (_, {}, context): Promise<Board[]> => {
			await assertAuthorized(context);
			return await BoardModel.find();
		},
		singleBoard: async (_, { id }, context): Promise<Board> => {
			await assertAuthorized(context);
			return await BoardModel.findOne({ _id: id });
		}
	},
	Mutation: {
		createNew: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new board
			try {
				const newBoard = await BoardModel.create({ name: name });
				return { board: newBoard };
			} catch (error) {
				console.log("Create new board mutation error:", error);
				return { board: undefined, errors: [{ message: "Unknown error creating new board", field: "name" }] };
			}
		}
	}
};
