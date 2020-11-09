import { Document, Model, model, Schema } from "mongoose";

export interface Board {
	name: string;
	creator: string;
	created?: Date;
}

const BoardSchema = new Schema({
	name: {
		type: Schema.Types.String,
		required: true,
		maxlength: 32,
		match: /^[A-Za-z0-9 ]*$/
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
