import { Document, Model, model, Schema } from "mongoose";

interface Clue {
	answer: string;
	question: string;
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

interface ClueModel extends Model<ClueDocument> {
	getClueId: (clue: { answer: string; question: string }) => Promise<ClueDocument>;
}

ClueSchema.statics.getClueId = async (clue: { answer: string; question: string }): Promise<ClueDocument> => {
	return (await ClueModel.findOneAndUpdate(clue, {}, { upsert: true }).exec())!;
};

export const ClueModel = model<ClueDocument>("clue", ClueSchema) as ClueModel;
