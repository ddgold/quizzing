import mongoose from "mongoose";

export default class Database {
	url: string;
	connection: mongoose.Connection;

	constructor(url: string) {
		this.url = url;
	}

	connect(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (this.connection) {
				return;
			}

			mongoose
				.connect(this.url, {
					useNewUrlParser: true,
					useFindAndModify: true,
					useUnifiedTopology: true,
					useCreateIndex: true
				})
				.then((mongoose) => {
					this.connection = mongoose.connection;
					resolve(this.url);
				})
				.catch((error) => {
					this.connection = undefined;
					reject(error);
				});
		});
	}

	disconnect() {
		if (!this.connection) {
			return;
		}

		mongoose.disconnect();
	}
}
