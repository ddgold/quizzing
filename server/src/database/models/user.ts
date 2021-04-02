import { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

import { Context } from "../../auth";
import { RecordDocument, RecordType } from "./record";

interface User {
	nickname: string;
	email: string;
	password: string;
	recent: { [type in RecordType]: string[] | RecordDocument[] };
	created: Date;
	lastLogin: Date;
}

const UserSchema = new Schema({
	nickname: {
		type: Schema.Types.String,
		unique: true,
		required: true,
		minlength: 3,
		maxlength: 18,
		match: /^[A-Za-z0-9_]*$/
	},
	email: {
		type: Schema.Types.String,
		unique: true,
		required: true,
		maxlength: 64,
		match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/
	},
	password: {
		type: Schema.Types.String,
		required: true,
		minlength: 8,
		maxlength: 64,
		match: /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^*-_=+])/
	},
	recent: {
		Board: [{ type: Schema.Types.ObjectId, ref: "board", default: [] }],
		Category: [{ type: Schema.Types.ObjectId, ref: "categories", default: [] }]
	},
	created: {
		type: Schema.Types.Date,
		default: new Date()
	},
	lastLogin: {
		type: Schema.Types.Date,
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
	recentRecord: (this: UserDocument, type: RecordType, id: string) => Promise<void>;
}

UserSchema.methods.comparePassword = async function (this: Document, candidatePassword: string): Promise<boolean> {
	const user = this as UserDocument;
	let result = await bcrypt.compare(candidatePassword, user.password);
	return result;
};

UserSchema.methods.recentRecord = async function (this: Document, type: RecordType, id: string): Promise<void> {
	const user = this as UserDocument;
	let found = false;
	for (let i = 0; i < user.recent[type].length; i++) {
		if (user.recent[type][i]!.toString() === id) {
			user.recent[type].splice(i, 1);
			found = true;
			break;
		}
	}

	if (!found && user.recent[type].length > 4) {
		user.recent[type].pop();
	}

	(user.recent[type] as string[]).unshift(id);

	user.updateOne({ recent: user.recent }).exec();
};

interface UserModel extends Model<UserDocument> {
	currentUser: (context: Context) => Promise<UserDocument | null>;
}

UserSchema.statics.currentUser = async (context: Context): Promise<UserDocument | null> => {
	try {
		if (context.req.headers["authorization"]) {
			return UserModel.findById(context.payload!.userId).exec();
		} else {
			return null;
		}
	} catch (error) {
		return null;
	}
};

export const UserModel = model<UserDocument>("user", UserSchema) as UserModel;
