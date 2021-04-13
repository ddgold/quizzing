import { ValidationError } from "apollo-server-errors";
import { model, Schema } from "mongoose";

import { CategoryFormat, CategoryObject } from "../../objects/build";
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

const CategorySchema = new Schema<CategoryDocument, CategoryModel>({
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
	generateColumn: (this: RecordDocument, rows: number) => Promise<ClueDocument[]>;
}

CategorySchema.methods.canEdit = async function (this: CategoryDocument, userId: string): Promise<boolean> {
	if (typeof this.creator === "string") {
		return userId === this.creator;
	} else {
		return userId === this.creator._id.toString();
	}
};

CategorySchema.methods.object = function (this: CategoryDocument): CategoryObject {
	return this as CategoryObject;
};

CategorySchema.methods.generateColumn = async function (this: CategoryDocument, rows: number): Promise<ClueDocument[]> {
	switch (this.format) {
		case CategoryFormat.Fixed: {
			if (this.clues.length !== rows) {
				throw new ValidationError(`Fixed category '${this.name}' does not have exactly ${rows} clues`);
			}

			return this.clues as ClueDocument[];
		}
		case CategoryFormat.Random: {
			if (this.clues.length! < rows) {
				throw new ValidationError(`Random category '${this.name}' does not have at least ${rows} clues`);
			}

			const clues: ClueDocument[] = [];
			for (let row = 0; row < rows; row++) {
				const randomIndex = Math.floor(Math.random() * this.clues.length);
				clues.push(this.clues.splice(randomIndex, 1)[0] as ClueDocument);
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

CategorySchema.statics.record = async (id: string) => {
	const category = await CategoryModel.findById(id).populate("clues").populate("creator").exec();
	if (category === null) {
		throw new ValidationError(`Category with id '${id} does not exist`);
	}
	return category;
};

CategorySchema.statics.records = async (ids: string[]): Promise<CategoryDocument[]> => {
	return Promise.all(
		ids.map((id: string) => {
			return (CategorySchema.statics.record as (id: string) => Promise<CategoryDocument>)(id);
		})
	);
};

export const CategoryModel = model("category", CategorySchema) as CategoryModel;
