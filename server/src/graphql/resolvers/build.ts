import { IResolvers } from "graphql-tools";

import { BoardDocument, BoardModel, CategoryDocument, CategoryModel } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const buildResolvers: IResolvers<any, Context> = {
	Query: {
		boards: async (_, { showAll }, context): Promise<BoardDocument[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await BoardModel.find().populate("creator").exec();
			} else {
				return await BoardModel.find({ creator: context.payload!.userId }).populate("creator").exec();
			}
		},
		boardById: async (_, { id }, context): Promise<BoardDocument> => {
			await assertAuthorized(context);
			return await BoardModel.findById(id).populate("creator").exec();
		},
		categories: async (_, { showAll }, context): Promise<CategoryDocument[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await CategoryModel.find().populate("creator").populate("clues").exec();
			} else {
				return await CategoryModel.find({ creator: context.payload!.userId })
					.populate("creator")
					.populate("clues")
					.exec();
			}
		},
		categoryById: async (_, { id }, context): Promise<CategoryDocument> => {
			await assertAuthorized(context);
			return await CategoryModel.findById(id).populate("creator").populate("clues").exec();
		}
	},
	Mutation: {
		createNewBoard: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new board
			try {
				const newBoard = await BoardModel.create({ name: name, creator: context.payload!.userId });
				return { result: newBoard };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Create new board mutation error: ${error.message}`);
						break;
					default:
						console.log("Create new board mutation unknown error:", error);
				}
				return { errors: [{ message: "Error creating new board", field: "name" }] };
			}
		},
		createNewCategory: async (_, { name }, context) => {
			await assertAuthorized(context);

			// Create new category
			try {
				const newCategory = await CategoryModel.create({ name: name, creator: context.payload!.userId });
				return { result: newCategory };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Create new category mutation error: ${error.message}`);
						break;
					default:
						console.log("Create new category mutation unknown error:", error);
				}
				return { errors: [{ message: "Error creating new category", field: "name" }] };
			}
		}
	}
};
