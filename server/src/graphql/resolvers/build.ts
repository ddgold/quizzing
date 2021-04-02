import { IResolvers } from "graphql-tools";
import { ForbiddenError, ValidationError } from "apollo-server-express";

import { Context, assertHttpAuthorized } from "../../auth";
import {
	BoardDocument,
	BoardModel,
	CategoryDocument,
	CategoryModel,
	ClueModel,
	getRecordTypeModel,
	RecordDocument,
	RecordType,
	UserModel
} from "../../database";
import { FormResult, QueryResult, SearchResult } from "../types";

export const BuildResolvers: IResolvers<any, Context> = {
	RecordType: {
		BOARD: "Board",
		CATEGORY: "Category"
	},
	ResultObject: {
		__resolveType(object: RecordDocument) {
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
			await assertHttpAuthorized(context);
			if (showAll) {
				return BoardModel.find()
					.populate({
						path: "categories",
						populate: ["clues", "creator"]
					})
					.populate("creator")
					.exec();
			} else {
				return BoardModel.find({ creator: context.payload!.userId })
					.populate({
						path: "categories",
						populate: ["clues", "creator"]
					})
					.populate("creator")
					.exec();
			}
		},
		categories: async (_, { showAll }, context): Promise<CategoryDocument[]> => {
			await assertHttpAuthorized(context);
			if (showAll) {
				return CategoryModel.find().populate("clues").populate("creator").exec();
			} else {
				return CategoryModel.find({ creator: context.payload!.userId }).populate("clues").populate("creator").exec();
			}
		},
		recentRecords: async (_, { type }: { type: RecordType }, context): Promise<RecordDocument[]> => {
			await assertHttpAuthorized(context);
			try {
				const user = (await UserModel.currentUser(context))!;
				const model = getRecordTypeModel(type);
				return model.records(user.recent[type] as string[]);
			} catch (error) {
				switch (error.name) {
					default: {
						console.error("Recent records query error:", error);
						throw error;
					}
				}
			}
		},
		recordById: async (_, { type, id }, context): Promise<QueryResult<RecordDocument>> => {
			await assertHttpAuthorized(context);
			try {
				const model = getRecordTypeModel(type);
				const record: RecordDocument | undefined = await model.record(id);

				if (!record) {
					return {};
				}

				(await UserModel.currentUser(context))!.recentRecord(type, id);

				return { result: record, canEdit: await record.canEdit(context.payload!.userId) };
			} catch (error) {
				switch (error.name) {
					case "CastError": {
						// id was not a valid ObjectId
						return {};
					}
					default: {
						console.error("Record by ID query error:", error);
						throw error;
					}
				}
			}
		},
		recordSearch: async (_, { type, name }, context): Promise<SearchResult<RecordDocument>> => {
			await assertHttpAuthorized(context);
			try {
				const model = getRecordTypeModel(type);
				return {
					result: await model
						.find({ name: { $regex: new RegExp(name, "i") } })
						.populate("creator")
						.exec()
				};
			} catch (error) {
				switch (error.name) {
					default: {
						console.error("Record search query error:", error);
						throw error;
					}
				}
			}
		}
	},
	Mutation: {
		createRecord: async (_, { type, name }, context): Promise<FormResult<RecordDocument>> => {
			await assertHttpAuthorized(context);
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
						throw new ValidationError(`Unknown record type '${type}'`);
					}
				}
			} catch (error) {
				switch (error.name) {
					case "ValidationError": {
						console.error(`Create record mutation validation error: ${error.message}`);
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
			await assertHttpAuthorized(context);

			const canEdit = await (await BoardModel.findById(id))?.canEdit(context.payload!.userId);
			if (!canEdit) {
				throw new ForbiddenError("No edit permission");
			}

			try {
				// Verify categories exist
				categoryIds = await Promise.all(
					categoryIds.map(async (categoryId: string) => {
						const category = await CategoryModel.findById(categoryId).exec();

						if (!category) {
							throw new ValidationError(`Category with id '${categoryId}' not found`);
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
					throw new ValidationError(`Board with id '${id}' not found`);
				}

				return { result: board };
			} catch (error) {
				switch (error.name) {
					case "ValidationError": {
						console.error(`Update board mutation validation error: ${error.message}`);
						break;
					}
					default: {
						console.error("Update board mutation unknown error:", error.name, error);
					}
				}
				return { errors: [{ message: "Error updating board", field: "name" }] };
			}
		},
		updateCategory: async (
			_,
			{ id, name, description, format, clues },
			context
		): Promise<FormResult<CategoryDocument>> => {
			await assertHttpAuthorized(context);

			const canEdit = await (await CategoryModel.findById(id))?.canEdit(context.payload!.userId);
			if (!canEdit) {
				throw new ForbiddenError("No edit permission");
			}

			try {
				const clueIds: string[] = await Promise.all(
					clues.map(async (clue: { answer: string; question: string }) => {
						return (await ClueModel.getClueId(clue)).id;
					})
				);

				const category = await CategoryModel.findByIdAndUpdate(id, {
					name: name,
					description: description,
					format: format,
					clues: clueIds,
					updated: new Date()
				})
					.populate("clues")
					.populate("creator")
					.exec();

				if (!category) {
					throw new ValidationError(`Category with id '${id}' not found`);
				}

				return { result: category };
			} catch (error) {
				switch (error.name) {
					case "ValidationError": {
						console.error(`Update category mutation validation error: ${error.message}`);
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
