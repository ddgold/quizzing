export { BoardDocument, BoardModel } from "./board";
export { CategoryDocument, CategoryModel } from "./category";
export { ClueDocument, ClueModel } from "./clue";
export { UserDocument, UserModel } from "./user";

import { BoardDocument, CategoryDocument } from ".";
export type RecordDocument = BoardDocument | CategoryDocument;
