import { Document, model, Schema } from "mongoose";

import { ClueDocument } from "./clue";
import { UserDocument } from "./user";
import { RecordDocument, RecordModel } from "./record";
import { ValidationError } from "apollo-server-errors";

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

export interface CategoryDocument extends Category, RecordDocument {
	generateColumn: (this: RecordDocument) => Promise<ClueDocument[]>;
}

CategorySchema.methods.canEdit = async function (this: Document, userId: string): Promise<boolean> {
	const category = this as CategoryDocument;
	if (typeof category.creator === "string") {
		return userId === category.creator;
	} else {
		return userId === category.creator._id.toString();
	}
};

CategorySchema.methods.generateColumn = async function (this: Document): Promise<ClueDocument[]> {
	const category = this as CategoryDocument;
	switch (category.format) {
		case CategoryFormat.Fixed: {
			if (category.clues.length !== 5) {
				throw new ValidationError("Fixed category does not have 5 clues");
			}

			return category.clues as ClueDocument[];
		}
		case CategoryFormat.Random: {
			const clues: ClueDocument[] = [];

			for (let row = 0; row < 5; row++) {
				const randomIndex = Math.floor(Math.random() * category.clues.length);
				clues.push(category.clues.splice(randomIndex, 1)[0] as ClueDocument);
			}

			return clues;
		}
		case CategoryFormat.Sorted: {
			// TODO

			return [];
		}
	}
};

interface CategoryModel extends RecordModel<CategoryDocument> {}

const categoryById = async (id: string) => {
	const category = await CategoryModel.findById(id).populate("clues").populate("creator").exec();
	if (category === null) {
		throw new ValidationError(`Category with id '${id} does not exist`);
	}
	return category;
};

CategorySchema.statics.record = categoryById;

CategorySchema.statics.records = async (ids: string[]): Promise<CategoryDocument[]> => {
	return Promise.all(
		ids.map((id: string) => {
			return categoryById(id);
		})
	);
};

export const CategoryModel = model<CategoryDocument>("category", CategorySchema) as CategoryModel;
