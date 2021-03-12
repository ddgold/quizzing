import { IResolvers } from "graphql-tools";
import { ForbiddenError, SyntaxError } from "apollo-server-express";

import { FormResult, QueryResult, ResultObject, SearchResult } from "../types";
import { BoardDocument, BoardModel, CategoryDocument, CategoryModel, ClueModel, RecordDocument } from "../../database";
import { Context, assertAuthorized } from "../../auth";

export const BuildResolvers: IResolvers<any, Context> = {
	RecordType: {
		BOARD: "Board",
		CATEGORY: "Category"
	},
	ResultObject: {
		__resolveType(object: ResultObject) {
			if ((object as BoardDocument).categories) {
				return "Board";
			}

			if ((object as CategoryDocument).clues) {
				return "Category";
			}

			return null;
		}
	},
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
		recordById: async (_, { type, id }, context): Promise<QueryResult<RecordDocument>> => {
			switch (type) {
				case "Board": {
					await assertAuthorized(context);
					let board = await BoardModel.findById(id)
						.populate({
							path: "categories",
							populate: ["clues", "creator"]
						})
						.populate("creator")
						.exec();

					if (!board) {
						return {};
					}

					const canEdit = await BoardModel.canEdit(id, context.payload!.userId);
					return { result: board, canEdit: canEdit };
				}
				case "Category": {
					await assertAuthorized(context);
					let category = await CategoryModel.findById(id).populate("clues").populate("creator").exec();

					if (!category) {
						return {};
					}

					const canEdit = await CategoryModel.canEdit(id, context.payload!.userId);
					return { result: category, canEdit: canEdit };
				}
				default: {
					console.error(`Record by ID query error: Unknown record type '${type}'`);
					throw new SyntaxError(`Unknown record type '${type}'`);
				}
			}
		},
		recordSearch: async (_, { type, name }, context): Promise<SearchResult<RecordDocument>> => {
			await assertAuthorized(context);
			switch (type) {
				case "Category": {
					let categories = await CategoryModel.find({ name: { $regex: name } })
						.populate("creator")
						.exec();
					return { result: categories };
				}
				default: {
					console.error(`Record search query error: Unknown record type '${type}'`);
					throw new SyntaxError(`Unknown record type '${type}'`);
				}
			}
		}
	},
	Mutation: {
		createRecord: async (_, { type, name }, context): Promise<FormResult<RecordDocument>> => {
			await assertAuthorized(context);
			try {
				switch (type) {
					case "Board": {
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
					}
					case "Category": {
						const newCategory = await CategoryModel.create({
							name: name,
							description: "",
							clues: [],
							creator: context.payload!.userId,
							created: new Date(),
							updated: new Date()
						});
						await newCategory.populate("creator").execPopulate();
						return { result: newCategory };
					}
					default: {
						throw new SyntaxError(`Unknown record type '${type}'`);
					}
				}
			} catch (error) {
				switch (error.name) {
					case "SyntaxError":
					case "ValidationError": {
						console.error(`Create record mutation error: ${error.message}`);
						break;
					}
					default: {
						console.error("Create record mutation unknown error:", error);
					}
				}
				return { errors: [{ message: `Error creating ${type.toLowerCase()}`, field: "name" }] };
			}
		},
		updateBoard: async (_, { id, name, description, categoryIds }, context): Promise<FormResult<BoardDocument>> => {
			await assertAuthorized(context);

			let canEdit = await BoardModel.canEdit(id, context.payload!.userId);
			if (!canEdit) {
				throw new ForbiddenError("No edit permission");
			}

			try {
				// Verify categories exist
				categoryIds = await Promise.all(
					categoryIds.map(async (categoryId: string) => {
						const category = await CategoryModel.findById(categoryId).exec();

						if (!category) {
							let error = Error(`Category with id '${categoryId}' not found`);
							error.name = "ValidationError";
							throw error;
						}

						return category.id;
					})
				);

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

				if (!board) {
					let error = Error(`Board with id '${id}' not found`);
					error.name = "ValidationError";
					throw error;
				}

				return { result: board };
			} catch (error) {
				switch (error.name) {
					case "ValidationError": {
						console.error(`Update board mutation error: ${error.message}`);
						break;
					}
					default: {
						console.error("Update board mutation unknown error:", error.name, error);
					}
				}
				return { errors: [{ message: "Error updating board", field: "name" }] };
			}
		},
		updateCategory: async (_, { id, name, description, clues }, context): Promise<FormResult<CategoryDocument>> => {
			await assertAuthorized(context);

			let canEdit = await CategoryModel.canEdit(id, context.payload!.userId);
			if (!canEdit) {
				throw new ForbiddenError("No edit permission");
			}

			try {
				let clueIds: string[] = await Promise.all(
					clues.map(async (clueObj: { answer: string; question: string }) => {
						const clue = await ClueModel.findOneAndUpdate(clueObj, {}, { upsert: true }).exec();
						return clue.id;
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

				if (!category) {
					let error = Error(`Category with id '${id}' not found`);
					error.name = "ValidationError";
					throw error;
				}

				return { result: category };
			} catch (error) {
				switch (error.name) {
					case "ValidationError": {
						console.error(`Update category mutation error: ${error.message}`);
						break;
					}
					default: {
						console.error("Update category mutation unknown error:", error);
					}
				}
				return { errors: [{ message: "Error updating category", field: "name" }] };
			}
		}
	}
};
