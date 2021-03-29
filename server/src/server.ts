import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { createServer } from "http";

import { assertWsAuthorized, postRefreshToken } from "./auth";
import Database from "./database";
import Engine from "./engine";
import { environmentConfig } from "./environment";
import { resolvers, typeDefs } from "./graphql";

// ------------------
// Environment Config
// ------------------
environmentConfig(
	["SECRETS_DIR", "FRONTEND_URL", "DATABASE_URL", "ENGINE_CACHE_URL"],
	["access_token", "refresh_token"]
);

// ------------------
// Redis Engine Cache
// ------------------
Engine.connect(process.env.ENGINE_CACHE_URL)
	.then((url) => {
		console.info(`Engine cache connected at ${url}`);
	})
	.catch((error) => {
		console.error("Error connecting to engine cache:", error);
	});

// ----------------
// mongoDB Database
// ----------------
Database.connect(process.env.DATABASE_URL)
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

const port = process.env.GRAPHQL_PORT || 8000;
httpServer.listen({ port: port }, () => {
	console.info(`Server running at http://localhost:${port}${apolloServer.graphqlPath}`);
	console.info(`Websocket running at ws://localhost:${port}${apolloServer.subscriptionsPath}`);
});
