import { IResolvers } from "graphql-tools";

import { Board, BoardModel, UserModel } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const buildResolvers: IResolvers<any, Context> = {
	Query: {
		boards: async (_, { showAll }, context): Promise<Board[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await BoardModel.find().populate("creator").exec();
			} else {
				return await BoardModel.find({ creator: context.payload!.userId }).populate("creator").exec();
			}
		},
		boardById: async (_, { id }, context): Promise<Board> => {
			await assertAuthorized(context);
			return await BoardModel.findById(id).populate("creator").exec();
		}
	},
	Mutation: {
		createNewBoard: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new board
			try {
				const newBoard = await BoardModel.create({ name: name, creator: context.payload!.userId });
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
