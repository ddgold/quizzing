import "graphql-import-node";

import typeDefs from "./schema.graphql";

import { userResolvers } from "./resolvers/user";
import { buildResolvers } from "./resolvers/build";
const resolvers = [userResolvers, buildResolvers];

export { typeDefs, resolvers };
