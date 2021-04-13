import { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

import { AccessLevel, assertHttpToken, Context, TokenPayload } from "../../auth";
import { RecordType } from "../../objects/build";
import { UserObject } from "../../objects/user";
import { RecordDocument } from "./record";

interface User {
	nickname: string;
	email: string;
	password: string;
	recent: { [type in RecordType]: string[] | RecordDocument[] };
	access: AccessLevel;
	created: Date;
	lastLogin: Date;
}

const UserSchema = new Schema<UserDocument, UserModel>({
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
		BOARD: [{ type: Schema.Types.ObjectId, ref: "board", default: [] }],
		CATEGORY: [{ type: Schema.Types.ObjectId, ref: "categories", default: [] }]
	},
	access: {
		type: Schema.Types.Number,
		required: true
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
	tokenPayload: (this: UserDocument) => TokenPayload;
	recentRecord: (this: UserDocument, type: RecordType, id: string) => Promise<void>;
	object: (this: UserDocument) => UserObject;
}

UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.tokenPayload = function (this: UserDocument): TokenPayload {
	return { userId: this.id, access: this.access };
};

UserSchema.methods.recentRecord = async function (this: UserDocument, type: RecordType, id: string): Promise<void> {
	let found = false;
	const recentRecords = this.recent[type];
	for (let i = 0; i < recentRecords.length; i++) {
		if (recentRecords[i]!.toString() === id) {
			recentRecords.splice(i, 1);
			found = true;
			break;
		}
	}

	if (!found && recentRecords.length > 4) {
		recentRecords.pop();
	}

	(recentRecords as string[]).unshift(id);

	this.updateOne({ recent: this.recent }).exec();
};

UserSchema.methods.object = function (this: UserDocument): UserObject {
	return this as UserObject;
};

interface UserModel extends Model<UserDocument> {
	currentUser: (context: Context) => Promise<UserDocument | null>;
}

UserSchema.statics.currentUser = async (context: Context): Promise<UserDocument | null> => {
	try {
		await assertHttpToken(context, AccessLevel.User);
		if (context.req.headers["authorization"]) {
			return UserModel.findById(context.payload!.userId).exec();
		} else {
			return null;
		}
	} catch (error) {
		return null;
	}
};

export const UserModel = model("user", UserSchema) as UserModel;
