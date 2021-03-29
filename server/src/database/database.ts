import mongoose, { Connection } from "mongoose";

export default class Database {
	// --------
	// Instance
	// --------
	private connection: Connection;

	private constructor(connection: Connection) {
		this.connection = connection;
	}

	// ---------
	// Singleton
	// ---------
	private static singleton: Database;

	static get connection(): Connection {
		if (this.singleton === undefined) {
			throw Error("Database not connected");
		}

		return this.singleton.connection;
	}

	static async connect(url: string): Promise<string> {
		if (this.singleton !== undefined) {
			throw Error("Database already connected");
		}

		mongoose.set("returnOriginal", false);
		await mongoose.connect(url, {
			useNewUrlParser: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
			useCreateIndex: true
		});

		this.singleton = new Database(mongoose.connection);
		return url;
	}

	static async disconnect(): Promise<void> {
		if (this.singleton === undefined) {
			throw Error("Database not connected");
		}

		await mongoose.disconnect();
		this.singleton = undefined;
	}
}
