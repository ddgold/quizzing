import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer } from "apollo-server-express";
import { config } from "dotenv-flow";

import { resolvers, typeDefs } from "./graphql";
import Database from "./database/database";
import { Context, postRefreshToken } from "./auth";

config({
	default_node_env: "development"
});

// ----------------
// mongoDB Database
// ----------------
const database = new Database();

database
	.connect(process.env.MONGODB_URL)
	.then((url) => {
		console.log(`Database connected at ${url}`);
	})
	.catch((error) => {
		console.log("Error connecting to database:", error);
	});

// -------------
// Apollo Server
// -------------
const app = express();

app.use(cookieParser());

app.post("/refreshToken", postRefreshToken);

const server = new ApolloServer({
	playground: process.env.NODE_ENV !== "production",
	resolvers,
	typeDefs,
	context: (Context) => Context
});

server.applyMiddleware({ app });

app.listen({ port: process.env.PORT }, () => {
	console.log(`Server running at http://localhost:${process.env.PORT}${server.graphqlPath}`);
});
