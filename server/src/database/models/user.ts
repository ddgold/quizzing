import { Document, Model, model, Schema } from "mongoose";

interface User {
	nickname: string;
	email: string;
	password: string;
	created?: Date;
	lastLogin?: Date;
}

const UserSchema = new Schema({
	nickname: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	created: {
		type: Date,
		default: new Date()
	},
	lastLogin: {
		type: Date,
		default: new Date()
	}
});

interface UserDocument extends User, Document {}

interface UserModel extends Model<UserDocument> {}

export const UserModel = model<UserDocument>("user", UserSchema) as UserModel;
