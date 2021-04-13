import { ValidationError } from "apollo-server-express";
import { model, Schema } from "mongoose";

import { BoardObject } from "../../objects/build";
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

const BoardSchema = new Schema<BoardDocument, BoardModel>({
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

BoardSchema.methods.canEdit = async function (this: BoardDocument, userId: string): Promise<boolean> {
	if (typeof this.creator === "string") {
		return userId === this.creator;
	} else {
		return userId === this.creator._id.toString();
	}
};

BoardSchema.methods.object = function (this: BoardDocument): BoardObject {
	return this as BoardObject;
};

interface BoardModel extends RecordModel<BoardDocument> {}

BoardSchema.statics.record = async (id: string): Promise<BoardDocument> => {
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

BoardSchema.statics.records = async (ids: string[]): Promise<BoardDocument[]> => {
	return Promise.all(
		ids.map((id: string) => {
			return (BoardSchema.statics.record as (id: string) => Promise<BoardDocument>)(id);
		})
	);
};

export const BoardModel = model("board", BoardSchema) as BoardModel;
