import { ApolloServer } from "apollo-server";
import { resolvers, typeDefs } from "./graphql";
import { config } from "dotenv-flow";

config({
	default_node_env: "development"
});

const server = new ApolloServer({
	typeDefs,
	resolvers,
	playground: process.env.NODE_ENV !== "production"
});

server.listen({ port: process.env.PORT }).then(({ url }) => {
	console.log(`server running at ${url}`);
});
