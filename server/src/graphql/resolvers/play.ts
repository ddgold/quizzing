import { withFilter } from "apollo-server-express";
import { IResolvers } from "graphql-tools";

import { assertHttpAuthorized, Context } from "../../auth";

import { dataTank, GameModel } from "../../engine";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		playGame: async (_, { id }: { id: string }, context): Promise<GameModel> => {
			await assertHttpAuthorized(context);

			const game = dataTank.game(id);
			if (game.boardId === id) {
				return game.model;
			}

			return null;
		}
	},
	Mutation: {
		selectClue: async (_, { id, row, col }: { id: string; row: number; col: number }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			dataTank.game(id).selectClue(row, col);
		},
		answerClue: async (_, { id }: { id: string }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			dataTank.game(id).answerClue();
		},
		closeClue: async (_, { id }: { id: string }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			dataTank.game(id).closeClue();
		}
	},
	Subscription: {
		playGame: {
			subscribe: withFilter(
				() => dataTank.pubsub.asyncIterator("PLAY_GAME"),
				(payload, variables) => {
					return payload.boardId === variables.id;
				}
			)
		}
	}
};
