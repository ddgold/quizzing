import { IResolvers } from "graphql-tools";

import { BoardDocument, BoardModel, CategoryDocument, CategoryModel, ClueDocument, ClueModel } from "../../database";
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
		createCategory: async (_, { name }, context) => {
			await assertAuthorized(context);
			try {
				const newCategory = await CategoryModel.create({
					name: name,
					description: "",
					clues: [],
					creator: context.payload!.userId,
					created: new Date(),
					updated: new Date()
				});
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
		},
		updateCategory: async (_, { id, name, description, clues }, context) => {
			await assertAuthorized(context);
			try {
				let clueIds: string[] = await Promise.all(
					clues.map(async (clue: ClueDocument) => {
						const doc = await ClueModel.findOneAndUpdate(
							{ answer: clue.answer, question: clue.question },
							{},
							{ upsert: true }
						).exec();
						return doc.id;
					})
				);

				const category = await CategoryModel.findByIdAndUpdate(id, {
					name: name,
					description: description,
					clues: clueIds,
					updated: new Date()
				})
					.populate("creator")
					.populate("clues")
					.exec();
				return { result: category };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Update category mutation error: ${error.message}`);
						break;
					default:
						console.log("Update category mutation unknown error:", error);
				}
				return { errors: [{ message: "Error updating category", field: "name" }] };
			}
		}
	}
};
