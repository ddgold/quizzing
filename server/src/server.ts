import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { createServer } from "http";

import { AccessLevel, assertWsToken, postRefreshToken } from "./auth";
import Database from "./database";
import Engine from "./engine";
import { checkEnvironmentConfig, getEnvironmentVariable } from "./environment";
import { resolvers, typeDefs } from "./graphql";

// ------------------
// Environment Config
// ------------------
checkEnvironmentConfig();

// ------------------
// Redis Engine Cache
// ------------------
Engine.connect(getEnvironmentVariable("ENGINE_CACHE_URL"))
	.then((url) => {
		console.info(`Engine cache connected at ${url}`);
	})
	.catch((error) => {
		console.error("Error connecting to engine cache:", error);
	});

// ----------------
// mongoDB Database
// ----------------
Database.connect(getEnvironmentVariable("DATABASE_URL"))
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
		origin: getEnvironmentVariable("FRONTEND_URL").split("|"),
		credentials: true
	})
);

expressApp.post("/refreshToken", postRefreshToken);

const apolloServer = new ApolloServer({
	playground: getEnvironmentVariable("NODE_ENV") !== "production",
	resolvers,
	typeDefs,
	context: (Context) => Context,
	subscriptions: {
		onConnect: (connectionParams: Object) => {
			assertWsToken(connectionParams, AccessLevel.User);
		}
	}
});

apolloServer.applyMiddleware({ app: expressApp, cors: false });

const httpServer = createServer(expressApp);
apolloServer.installSubscriptionHandlers(httpServer);

const port = getEnvironmentVariable("GRAPHQL_PORT");
httpServer.listen({ port: port }, () => {
	console.info(`Server running at http://localhost:${port}${apolloServer.graphqlPath}`);
	console.info(`Websocket running at ws://localhost:${port}${apolloServer.subscriptionsPath}`);
});
