import { Document, Model, model, Schema } from "mongoose";

import { ClueObject } from "../../objects/build";

interface Clue {
	answer: string;
	question: string;
}

const ClueSchema = new Schema<ClueDocument, ClueModel>({
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

export interface ClueDocument extends Clue, Document {
	object: (this: ClueDocument) => ClueObject;
}

ClueSchema.methods.object = function (this: ClueDocument): ClueObject {
	return this as ClueObject;
};

interface ClueModel extends Model<ClueDocument> {
	getClueId: (clue: { answer: string; question: string }) => Promise<ClueDocument>;
}

ClueSchema.statics.getClueId = async (clue: { answer: string; question: string }): Promise<ClueDocument> => {
	return (await ClueModel.findOneAndUpdate(clue, {}, { upsert: true }).exec())!;
};

export const ClueModel = model("clue", ClueSchema) as ClueModel;
