import { Document, Model, model, Schema } from "mongoose";

interface Clue {
	answer: String;
	question: String;
}

const ClueSchema = new Schema({
	answer: {
		type: Schema.Types.String,
		required: true,
		minlength: 1,
		maxlength: 128
	},
	question: {
		type: Schema.Types.String,
		required: true,
		minlength: 1,
		maxlength: 64
	}
});

export interface ClueDocument extends Clue, Document {}

interface ClueModel extends Model<ClueDocument> {}

export const ClueModel = model<ClueDocument>("clue", ClueSchema) as ClueModel;
