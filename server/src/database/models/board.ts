import { ValidationError } from "apollo-server-express";
import { Document, model, Schema } from "mongoose";

import { CategoryDocument } from "./category";
import { UserDocument } from "./user";
import { RecordDocument, RecordModel } from "./record";

interface Board {
	name: string;
	description: string;
	categories: string[] | CategoryDocument[];
	creator: string | UserDocument;
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

	// Sanitize description
	if (this.isModified("description")) {
		this.description = this.description.trim();
	}

	return next();
});

export interface BoardDocument extends Board, RecordDocument {}

BoardSchema.methods.canEdit = async function (this: Document, userId: string): Promise<boolean> {
	const board = this as BoardDocument;
	if (typeof board.creator === "string") {
		return userId === board.creator;
	} else {
		return userId === board.creator._id.toString();
	}
};

interface BoardModel extends RecordModel<BoardDocument> {}

const boardById = async (id: string): Promise<BoardDocument> => {
	const board = await BoardModel.findById(id)
		.populate({
			path: "categories",
			populate: ["clues", "creator"]
		})
		.populate("creator")
		.exec();

	if (board === null) {
		throw new ValidationError(`Board with id '${id}' not found`);
	}

	return board;
};

BoardSchema.statics.record = boardById;

BoardSchema.statics.records = async (ids: string[]): Promise<BoardDocument[]> => {
	return Promise.all(
		ids.map((id: string) => {
			return boardById(id);
		})
	);
};

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
