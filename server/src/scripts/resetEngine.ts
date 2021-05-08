import Engine from "../engine";

const resetEngine = async (url: string): Promise<void> => {
	try {
		console.info("Resetting engine...");
		await Engine.connect(url);

		try {
			Engine.reset();
		} catch (error) {
			console.error("Error resetting engine:", error);
		}

		await Engine.disconnect();
		console.info("Done");
	} catch (error) {
		console.error("Error connecting to engine cache:", error);
	}
};

resetEngine("redis://localhost:6379/");
