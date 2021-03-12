import { PubSub, withFilter } from "apollo-server-express";
import { IResolvers } from "graphql-tools";

import { Context } from "../../auth";

const pubsub = new PubSub();

export const PlayResolvers: IResolvers<any, Context> = {
	Subscription: {
		playGame: {
			subscribe: withFilter(
				() => pubsub.asyncIterator("PLAY_GAME"),
				(payload, variables) => {
					return payload.playGame !== variables.id;
				}
			)
		}
	}
};

setInterval(() => {
	pubsub.publish("PLAY_GAME", {
		playGame: new Date().toISOString()
	});
}, 200);
