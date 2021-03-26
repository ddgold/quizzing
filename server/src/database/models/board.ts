import { model, Schema } from "mongoose";
import { v4 as uuid } from "uuid";

import { CategoryDocument, CategoryFormat } from "./category";
import { ClueDocument } from "./clue";
import { ClueModel, GameModel } from "../../engine";
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

BoardSchema.methods.canEdit = async function (this: BoardDocument, userId: string): Promise<boolean> {
	if (typeof this.creator === "string") {
		return userId === this.creator;
	} else {
		return userId === this.creator._id.toString();
	}
};

interface BoardModel extends RecordModel<BoardDocument> {
	generateGame: (boardId: string) => Promise<[GameModel, ClueModel[][]]>;
}

BoardSchema.statics.record = async function (id: string): Promise<BoardDocument> {
	return BoardModel.findById(id)
		.populate({
			path: "categories",
			populate: ["clues", "creator"]
		})
		.populate("creator")
		.exec();
};

BoardSchema.statics.records = async function (ids: string[]): Promise<BoardDocument[]> {
	return Promise.all(
		ids.map((id: string) => {
			return BoardModel.findById(id)
				.populate({
					path: "categories",
					populate: ["clues", "creator"]
				})
				.populate("creator")
				.exec();
		})
	);
};

BoardSchema.statics.generateGame = async (id: string): Promise<[GameModel, ClueModel[][]]> => {
	try {
		let board = await BoardModel.findById(id)
			.populate({
				path: "categories",
				populate: ["clues", "creator"]
			})
			.exec();

		if (board.categories.length < 6) {
			throw new Error("Board does not have enough categories");
		}

		const categories: string[] = [];
		const clues: ClueModel[][] = [];

		for (let col = 0; col < 6; col++) {
			const randomIndex = Math.floor(Math.random() * board.categories.length);
			const category = board.categories.splice(randomIndex, 1)[0] as CategoryDocument;

			categories.push(category.name);
			clues.push([]);

			switch (category.format) {
				case CategoryFormat.Fixed: {
					if (category.clues.length !== 5) {
						throw new Error("Fixed category does not have 5 clues");
					}

					clues[col] = category.clues as ClueDocument[];
				}
				case CategoryFormat.Random: {
					for (let row = 0; row < 5; row++) {
						const randomIndex = Math.floor(Math.random() * category.clues.length);
						clues[col].push(category.clues.splice(randomIndex, 1)[0] as ClueDocument);
					}
				}
				case CategoryFormat.Sorted: {
					// TODO
				}
			}
		}

		return [
			{
				id: uuid(),
				name: board.name,
				categories: categories,
				rows: [
					{ cols: [false, false, false, false, false, false], value: 200 },
					{ cols: [false, false, false, false, false, false], value: 400 },
					{ cols: [false, false, false, false, false, false], value: 600 },
					{ cols: [false, false, false, false, false, false], value: 800 },
					{ cols: [false, false, false, false, false, false], value: 1000 }
				],
				started: new Date()
			},
			clues
		];
	} catch (error) {
		throw error;
	}
};

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
