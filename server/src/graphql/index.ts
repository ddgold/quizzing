import "graphql-import-node";

import typeDefs from "./schema.graphql";

import { authResolvers } from "./resolvers/auth";
import { buildResolvers } from "./resolvers/build";
const resolvers = [authResolvers, buildResolvers];

export { typeDefs, resolvers };
