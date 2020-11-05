import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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

app.use(
	cors({
		origin: process.env.FRONTEND_URL,
		credentials: true
	})
);

app.post("/refreshToken", postRefreshToken);

const server = new ApolloServer({
	playground: process.env.NODE_ENV !== "production",
	resolvers,
	typeDefs,
	context: (Context) => Context
});

server.applyMiddleware({ app, cors: false });

app.listen({ port: process.env.GRAPHQL_PORT }, () => {
	console.log(`Server running at http://localhost:${process.env.GRAPHQL_PORT}${server.graphqlPath}`);
});
