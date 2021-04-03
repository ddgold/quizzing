import { ValidationError } from "apollo-server-express";
import { Document, model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";

import { CategoryDocument } from "./category";
import { Fields } from "../../engine";
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

interface BoardModel extends RecordModel<BoardDocument> {
	generateGame: (boardId: string, hostId: string) => Promise<[string, Map<string, string>]>;
}

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

BoardSchema.statics.generateGame = async (boardId: string, hostId: string): Promise<[string, Map<string, string>]> => {
	let board = await BoardModel.findById(boardId)
		.populate({
			path: "categories",
			populate: ["clues", "creator"]
		})
		.exec();

	if (board === null) {
		throw new ValidationError(`Board with id '${boardId}' not found`);
	}

	if (board.categories.length < 6) {
		throw new ValidationError("Board does not have enough categories");
	}

	const cols = 6;
	const rows = 5;
	const map = new Map<string, string>();

	map.set(Fields.Name(), board.name);
	map.set(Fields.Host(), hostId);
	map.set(Fields.State(), "AwaitingSelection");
	map.set(Fields.Started(), new Date().toUTCString());
	map.set(Fields.Size(), `${cols}^${rows}`);

	for (let col = 0; col < cols; col++) {
		const randomIndex = Math.floor(Math.random() * board.categories.length);
		const category = board.categories.splice(randomIndex, 1)[0] as CategoryDocument;

		map.set(Fields.Category(col), category.name);

		const clues = await category.generateColumn();
		for (let row = 0; row < rows; row++) {
			map.set(Fields.Clue(row, col), JSON.stringify(clues[row]));
		}
	}

	for (let row = 0; row < rows; row++) {
		map.set(Fields.Value(row), `${(row + 1) * 200}`);
	}

	return [uuid(), map];
};

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
