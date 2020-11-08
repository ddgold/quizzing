import { IResolvers } from "graphql-tools";

import { Board, BoardModel, UserModel } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const buildResolvers: IResolvers<any, Context> = {
	Query: {
		boards: async (_, { showAll }, context): Promise<Board[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await BoardModel.find();
			} else {
				const currentUser = await UserModel.findOne({ _id: context.payload!.userId });
				return await BoardModel.find({ creator: currentUser._id });
			}
		},
		boardById: async (_, { id }, context): Promise<Board> => {
			await assertAuthorized(context);
			return await BoardModel.findOne({ _id: id });
		}
	},
	Mutation: {
		createNewBoard: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new board
			try {
				const currentUser = await UserModel.findOne({ _id: context.payload!.userId });
				const newBoard = await BoardModel.create({ name: name, creator: currentUser._id });
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
