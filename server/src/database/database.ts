import mongoose from "mongoose";

export default class Database {
	connection: mongoose.Connection;

	constructor() {}

	connect(url: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (this.connection) {
				return;
			}

			mongoose.set("returnOriginal", false);

			mongoose
				.connect(url, {
					useNewUrlParser: true,
					useFindAndModify: false,
					useUnifiedTopology: true,
					useCreateIndex: true
				})
				.then((mongoose) => {
					this.connection = mongoose.connection;
					resolve(url);
				})
				.catch((error) => {
					this.connection = undefined;
					reject(error);
				});
		});
	}

	disconnect(): void {
		if (!this.connection) {
			return;
		}

		mongoose.disconnect();
	}
}
