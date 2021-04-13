import { ValidationError } from "apollo-server-errors";
import { Document, Model } from "mongoose";

import { RecordObject, RecordType } from "../../objects/build";
import { BoardModel } from "./board";
import { CategoryModel } from "./category";

export const getRecordTypeModel = (type: RecordType): RecordModel<any> => {
	switch (type) {
		case RecordType.Board:
			return BoardModel;
		case RecordType.Category:
			return CategoryModel;
		default:
			throw new ValidationError(`Unknown record type '${type}'`);
	}
};

export interface RecordDocument extends Document {
	canEdit: (this: RecordDocument, userId: string) => Promise<boolean>;
	object: (this: RecordDocument) => RecordObject;
}

export interface RecordModel<DocumentType extends RecordDocument> extends Model<DocumentType> {
	record: (id: string) => Promise<DocumentType>;
	records: (ids: string[]) => Promise<DocumentType[]>;
}
