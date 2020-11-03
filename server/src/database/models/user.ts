import { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

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

// Hash password before saving
UserSchema.pre("save", async function (this: UserDocument, next) {
	if (!this.isModified("password")) {
		return next();
	}

	const salt = await bcrypt.genSalt();
	this.password = await bcrypt.hash(this.password, salt);
	return next();
});

interface UserDocument extends User, Document {
	comparePassword: (this: UserDocument, candidatePassword: string) => Promise<boolean>;
}

UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string) {
	let result = await bcrypt.compare(candidatePassword, this.password);
	return result;
};

interface UserModel extends Model<UserDocument> {}

export const UserModel = model<UserDocument>("user", UserSchema) as UserModel;
