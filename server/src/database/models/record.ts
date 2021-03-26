import { Document, Model } from "mongoose";

import { BoardModel } from "./board";
import { CategoryModel } from "./category";

export enum RecordType {
	"Board" = "Board",
	"Category" = "Category"
}

export const getRecordTypeModel = (type: RecordType): RecordModel<any> => {
	switch (type) {
		case RecordType.Board:
			return BoardModel;
		case RecordType.Category:
			return CategoryModel;
		default:
			throw new SyntaxError(`Unknown record type '${type}'`);
	}
};

export interface RecordModel<DocumentType extends Document> extends Model<DocumentType> {
	record: (id: string) => Promise<DocumentType>;
	records: (ids: string[]) => Promise<DocumentType[]>;
}

export interface RecordDocument extends Document {
	canEdit: (this: RecordDocument, userId: string) => Promise<boolean>;
}
