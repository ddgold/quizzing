import { Document, Model, model, Schema } from "mongoose";

interface Category {
	name: String;
	description?: String;
	clues?: String[];
	creator: string;
	created?: Date;
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
		default: new Date(),
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

interface CategoryModel extends Model<CategoryDocument> {}

export const CategoryModel = model<CategoryDocument>("category", CategorySchema) as CategoryModel;
