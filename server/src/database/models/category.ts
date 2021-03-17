import { Document, Model, model, Schema } from "mongoose";

import { ClueDocument } from "./clue";

interface Category {
	name: string;
	description: string;
	format: CategoryFormat;
	clues: string[] | ClueDocument[];
	creator: string;
	created: Date;
	updated: Date;
}

export enum CategoryFormat {
	Fixed = "FIXED",
	Random = "RANDOM",
	Sorted = "SORTED"
}

const CategorySchema = new Schema({
	name: {
		type: Schema.Types.String,
		required: true,
		minlength: 1,
		maxlength: 32
	},
	description: {
		type: Schema.Types.String,
		required: false,
		maxlength: 265
	},
	format: {
		type: Schema.Types.String,
		enum: [CategoryFormat.Fixed, CategoryFormat.Random, CategoryFormat.Sorted],
		default: CategoryFormat.Random
	},
	clues: {
		type: [{ type: Schema.Types.ObjectId, ref: "clue" }],
		default: []
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: "user",
		required: true
	},
	created: {
		type: Schema.Types.Date,
		required: true
	},
	updated: {
		type: Schema.Types.Date,
		required: true
	}
});

// Sanitize name
CategorySchema.pre("save", async function (this: CategoryDocument, next) {
	if (this.isModified("name")) {
		this.name = this.name.trim();
	}
	return next();
});

export interface CategoryDocument extends Category, Document {}

interface CategoryModel extends Model<CategoryDocument> {
	canEdit: (categoryId: string, userId: string) => Promise<boolean>;
}

CategorySchema.statics.canEdit = async function (categoryId: string, userId: string): Promise<boolean> {
	let category = await CategoryModel.findById(categoryId).exec();
	if (!category) {
		return false;
	}

	return userId == category.creator;
};

export const CategoryModel = model<CategoryDocument>("category", CategorySchema) as CategoryModel;
