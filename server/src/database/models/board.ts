import { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

interface Board {
	name: string;
	created?: Date;
}

const BoardSchema = new Schema({
	name: {
		type: String,
		unique: true,
		required: true
	},
	created: {
		type: Date,
		default: new Date()
	}
});

interface BoardDocument extends Board, Document {}

interface BoardModel extends Model<BoardDocument> {}

export const BoardModel = model<BoardDocument>("board", BoardSchema) as BoardModel;
