import "graphql-import-node";

import typeDefs from "./schema.graphql";

import { BuildResolvers } from "./resolvers/build";
import { PlayResolvers } from "./resolvers/play";
import { UserResolvers } from "./resolvers/user";
const resolvers = [BuildResolvers, PlayResolvers, UserResolvers];

export { typeDefs, resolvers };
