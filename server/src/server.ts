import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { config } from "dotenv-flow";
import { createServer } from "http";

import { resolvers, typeDefs } from "./graphql";
import Database from "./database/database";
import { assertWsAuthorized, postRefreshToken } from "./auth";
import { environmentConfig } from "./environment";

// ------------------
// Environment Config
// ------------------
config({
	default_node_env: "development"
});

environmentConfig(["SECRETS_DIR", "GRAPHQL_PORT", "FRONTEND_URL", "MONGODB_URL"], ["access_token", "refresh_token"]);

// ----------------
// mongoDB Database
// ----------------
const database = new Database();

database
	.connect(process.env.MONGODB_URL)
	.then((url) => {
		console.info(`Database connected at ${url}`);
	})
	.catch((error) => {
		console.error("Error connecting to database:", error);
	});

// -------------
// Apollo Server
// -------------
const expressApp = express();

expressApp.use(cookieParser());

expressApp.use(
	cors({
		origin: process.env.FRONTEND_URL.split("|"),
		credentials: true
	})
);

expressApp.post("/refreshToken", postRefreshToken);

const apolloServer = new ApolloServer({
	playground: process.env.NODE_ENV !== "production",
	resolvers,
	typeDefs,
	context: (Context) => Context,
	subscriptions: {
		onConnect: (connectionParams: { authorization: string }) => {
			assertWsAuthorized(connectionParams.authorization);
		}
	}
});

apolloServer.applyMiddleware({ app: expressApp, cors: false });

const httpServer = createServer(expressApp);
apolloServer.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: process.env.GRAPHQL_PORT }, () => {
	console.info(`Server running at http://localhost:${process.env.GRAPHQL_PORT}${apolloServer.graphqlPath}`);
	console.info(`Websocket running at ws://localhost:${process.env.GRAPHQL_PORT}${apolloServer.subscriptionsPath}`);
});
