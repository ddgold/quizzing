import Engine from "../engine";

const resetEngine = async (url: string): Promise<void> => {
	try {
		await Engine.connect(url);

		try {
			Engine.reset();
		} catch (error) {
			console.error("Error resetting engine:", error);
		}

		await Engine.disconnect();
		console.info("done");
	} catch (error) {
		console.error("Error connecting to engine cache:", error);
	}
};

resetEngine("redis://localhost:6379/");
