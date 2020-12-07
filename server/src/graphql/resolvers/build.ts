import { IResolvers } from "graphql-tools";
import { ForbiddenError } from "apollo-server-express";

import { QueryError } from "../types";
import { BoardDocument, BoardModel, CategoryDocument, CategoryModel, ClueDocument, ClueModel } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const buildResolvers: IResolvers<any, Context> = {
	Query: {
		boards: async (_, { showAll }, context): Promise<BoardDocument[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await BoardModel.find()
					.populate({
						path: "categories",
						populate: ["clues", "creator"]
					})
					.populate("creator")
					.exec();
			} else {
				return await BoardModel.find({ creator: context.payload!.userId })
					.populate({
						path: "categories",
						populate: ["clues", "creator"]
					})
					.populate("creator")
					.exec();
			}
		},
		boardById: async (_, { id }, context): Promise<QueryError<BoardDocument>> => {
			await assertAuthorized(context);
			let board = await BoardModel.findById(id)
				.populate({
					path: "categories",
					populate: ["clues", "creator"]
				})
				.populate("creator")
				.exec();

			let canEdit = await BoardModel.canEdit(id, context.payload!.userId);
			return { result: board, canEdit: canEdit };
		},
		categories: async (_, { showAll }, context): Promise<CategoryDocument[]> => {
			await assertAuthorized(context);
			if (showAll) {
				return await CategoryModel.find().populate("clues").populate("creator").exec();
			} else {
				return await CategoryModel.find({ creator: context.payload!.userId })
					.populate("clues")
					.populate("creator")
					.exec();
			}
		},
		categoryById: async (_, { id }, context): Promise<CategoryDocument> => {
			await assertAuthorized(context);
			return await CategoryModel.findById(id).populate("clues").populate("creator").exec();
		}
	},
	Mutation: {
		createBoard: async (_, { name }, context) => {
			await assertAuthorized(context);
			try {
				const newBoard = await BoardModel.create({
					name: name,
					description: "",
					categories: [],
					creator: context.payload!.userId,
					created: new Date(),
					updated: new Date()
				});

				await newBoard.populate("creator").execPopulate();

				return { result: newBoard };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Create board mutation error: ${error.message}`);
						break;
					default:
						console.log("Create board mutation unknown error:", error);
				}
				return { errors: [{ message: "Error creating board", field: "name" }] };
			}
		},
		updateBoard: async (_, { id, name, description, categoryIds }, context) => {
			await assertAuthorized(context);

			let canEdit = await BoardModel.canEdit(id, context.payload!.userId);
			if (!canEdit) {
				throw new ForbiddenError("No edit permission");
			}

			try {
				// Verify categories exist
				let errors: { message: string; field: string }[] = [];
				categoryIds = await Promise.all(
					categoryIds.map(async (categoryId: string, index: number) => {
						try {
							const categoryDoc = await CategoryModel.findById(categoryId).exec();

							if (!categoryDoc) {
								errors.push({ message: "Category not found", field: `categoryIds[${index}]` });
								return;
							}

							return categoryDoc.id;
						} catch (error) {
							if (error.name === "CastError") {
								errors.push({ message: "Category not found", field: `categoryIds[${index}]` });
								return;
							}

							throw error;
						}
					})
				);

				if (errors.length) {
					return { errors: errors };
				}

				const board = await BoardModel.findByIdAndUpdate(id, {
					name: name,
					description: description,
					categories: categoryIds,
					updated: new Date()
				})
					.populate({
						path: "categories",
						populate: ["clues", "creator"]
					})
					.populate("creator")
					.exec();

				if (board === null) {
					let error = Error(`Board with id '${id}' not found`);
					error.name = "ValidationError";
					throw error;
				}

				return { result: board };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Update board mutation error: ${error.message}`);
						break;
					default:
						console.log("Update board mutation unknown error:", error.name, error);
				}
				return { errors: [{ message: "Error updating board", field: "name" }] };
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

				newCategory.populate("creator").execPopulate();

				return { result: newCategory };
			} catch (error) {
				switch (error.name) {
					case "ValidationError":
						console.log(`Create category mutation error: ${error.message}`);
						break;
					default:
						console.log("Create category mutation unknown error:", error);
				}
				return { errors: [{ message: "Error creating category", field: "name" }] };
			}
		},
		updateCategory: async (_, { id, name, description, clues }, context) => {
			await assertAuthorized(context);
			try {
				let clueIds: string[] = await Promise.all(
					clues.map(async (clue: ClueDocument, index: number) => {
						const clueDoc = await ClueModel.findOneAndUpdate(
							{ answer: clue.answer, question: clue.question },
							{},
							{ upsert: true }
						).exec();
						return clueDoc.id;
					})
				);

				const category = await CategoryModel.findByIdAndUpdate(id, {
					name: name,
					description: description,
					clues: clueIds,
					updated: new Date()
				})
					.populate("clues")
					.populate("creator")
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
