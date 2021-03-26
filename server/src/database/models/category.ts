import { model, Schema } from "mongoose";

import { ClueDocument } from "./clue";
import { UserDocument } from "./user";
import { RecordDocument, RecordModel } from "./record";

interface Category {
	name: string;
	description: string;
	format: CategoryFormat;
	clues: string[] | ClueDocument[];
	creator: string | UserDocument;
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

CategorySchema.pre("save", async function (this: CategoryDocument, next) {
	// Sanitize name
	if (this.isModified("name")) {
		this.name = this.name.trim();
	}

	// Sanitize description
	if (this.isModified("description")) {
		this.description = this.description.trim();
	}

	return next();
});

export interface CategoryDocument extends Category, RecordDocument {}

CategorySchema.methods.canEdit = async function (this: CategoryDocument, userId: string): Promise<boolean> {
	if (typeof this.creator === "string") {
		return userId === this.creator;
	} else {
		return userId === this.creator._id.toString();
	}
};

interface CategoryModel extends RecordModel<CategoryDocument> {}

CategorySchema.statics.record = async function (id: string): Promise<CategoryDocument> {
	return CategoryModel.findById(id).populate("clues").populate("creator").exec();
};

CategorySchema.statics.records = async function (ids: string[]): Promise<CategoryDocument[]> {
	return Promise.all(
		ids.map((id: string) => {
			return CategoryModel.findById(id).populate("clues").populate("creator").exec();
		})
	);
};

export const CategoryModel = model<CategoryDocument>("category", CategorySchema) as CategoryModel;
