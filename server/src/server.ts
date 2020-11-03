import { ApolloServer } from "apollo-server";
import { config } from "dotenv-flow";

import { resolvers, typeDefs } from "./graphql";
import Database from "./database/database";

config({
	default_node_env: "development"
});

// ----------------
// mongoDB Database
// ----------------
const database = new Database(process.env.MONGODB_URL);

database
	.connect()
	.then((url) => {
		console.log(`Database connected at ${url}`);
	})
	.catch((error) => {
		console.log("Error connecting to database:", error);
	});

// -------------
// Apollo Server
// -------------
const server = new ApolloServer({
	typeDefs,
	resolvers,
	playground: process.env.NODE_ENV !== "production"
});

server
	.listen({ port: process.env.PORT })
	.then(({ url }) => {
		console.log(`Server running at ${url}`);
	})
	.catch((error) => {
		console.log("Error establishing server:", error);
	});
