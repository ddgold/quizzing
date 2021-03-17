import { withFilter } from "apollo-server-express";
import { IResolvers } from "graphql-tools";

import { assertHttpAuthorized, Context } from "../../auth";
import { dataTank, GameModel } from "../../engine";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		currentGames: async (_, __, context): Promise<GameModel[]> => {
			await assertHttpAuthorized(context);
			return dataTank.games().map((game) => {
				return game.model;
			});
		},
		playGame: async (_, { id }: { id: string }, context): Promise<GameModel> => {
			await assertHttpAuthorized(context);
			return dataTank.game(id).model;
		}
	},
	Mutation: {
		hostGame: async (_, { boardId }: { boardId: string }, context): Promise<string> => {
			await assertHttpAuthorized(context);
			return await dataTank.host(boardId);
		},
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
					return payload.playGame.id === variables.id;
				}
			)
		}
	}
};
