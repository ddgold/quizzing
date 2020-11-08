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
		createNewBoard: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new board
			try {
				const newBoard = await BoardModel.create({ name: name });
				return { board: newBoard };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Create new board mutation error: ${error.message}`);
						break;
					default:
						console.log("Create new board mutation unknown error:", error);
				}
				return { board: undefined, errors: [{ message: "Error creating new board", field: "name" }] };
			}
		}
	}
};
