import { Document, Model, model, Schema } from "mongoose";

interface Board {
	name: string;
	description: string;
	categories: string[];
	creator: string;
	created: Date;
	updated: Date;
}

const BoardSchema = new Schema({
	name: {
		type: Schema.Types.String,
		required: true,
		minlength: 1,
		maxlength: 32
	},
	description: {
		type: Schema.Types.String,
		required: false,
		minlength: 0,
		maxlength: 265
	},
	categories: {
		type: [{ type: Schema.Types.ObjectId, ref: "category" }],
		required: true
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

BoardSchema.pre("save", async function (this: BoardDocument, next) {
	// Sanitize name
	if (this.isModified("name")) {
		this.name = this.name.trim();
	}

	// Sanitize name
	if (this.isModified("description")) {
		this.description = this.description.trim();
	}

	return next();
});

export interface BoardDocument extends Board, Document {}

interface BoardModel extends Model<BoardDocument> {
	canEdit: (boardId: string, userId: string) => Promise<boolean>;
}

BoardSchema.statics.canEdit = async function (boardId: string, userId: string): Promise<boolean> {
	let board = await BoardModel.findById(boardId).exec();
	if (!board) {
		return false;
	}

	return userId == board.creator;
};

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
