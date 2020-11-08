import { Document, Model, model, Schema } from "mongoose";

export interface Board {
	name: string;
	created?: Date;
}

const BoardSchema = new Schema({
	name: {
		type: String,
		required: true,
		maxlength: 32,
		match: /^[A-Za-z0-9 ]*$/
	},
	created: {
		type: Date,
		default: new Date()
	}
});

// Sanitize name
BoardSchema.pre("save", async function (this: BoardDocument, next) {
	if (!this.isModified("name")) {
		return next();
	}
	this.name = this.name.trim();
	return next();
});

export interface BoardDocument extends Board, Document {}

interface BoardModel extends Model<BoardDocument> {}

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
