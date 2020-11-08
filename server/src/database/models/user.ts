import { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface User {
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
		required: true,
		minlength: 3,
		maxlength: 18,
		match: /^[A-Za-z0-9_]*$/
	},
	email: {
		type: String,
		unique: true,
		required: true,
		maxlength: 64,
		match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/
	},
	password: {
		type: String,
		required: true,
		minlength: 8,
		maxlength: 64,
		match: /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^*-_=+])/
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

export interface UserDocument extends User, Document {
	comparePassword: (this: UserDocument, candidatePassword: string) => Promise<boolean>;
}

UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string) {
	let result = await bcrypt.compare(candidatePassword, this.password);
	return result;
};

interface UserModel extends Model<UserDocument> {}

export const UserModel = model<UserDocument>("user", UserSchema) as UserModel;
