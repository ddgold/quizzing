import { IResolvers } from "graphql-tools";

import { AccessLevel, assertHttpToken, Context } from "../../auth";
import { GameObject, GameFilter } from "../../objects/play";
import Engine from "../../engine";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		games: async (_, { filter }: { filter: GameFilter }, context): Promise<GameObject[]> => {
			switch (filter) {
				case GameFilter.All: {
					await assertHttpToken(context, AccessLevel.Admin);
					return Engine.allGames();
				}
				case GameFilter.User: {
					await assertHttpToken(context, AccessLevel.User);
					return Engine.usersGames(context.payload!.userId);
				}
				case GameFilter.Public: {
					await assertHttpToken(context, AccessLevel.User);
					return Engine.publicGames(context.payload!.userId);
				}
			}
		},
		playGame: async (_, { gameId }: { gameId: string }, context): Promise<GameObject> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.playGame(gameId, context.payload!.userId);
		}
	},
	Mutation: {
		hostGame: async (_, { boardId }: { boardId: string }, context): Promise<string> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.host(boardId, context.payload!.userId);
		},
		joinGame: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.join(gameId, context.payload!.userId);
		},
		selectClue: async (_, { gameId, row, col }: { gameId: string; row: number; col: number }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.selectClue(gameId, context.payload!.userId, row, col);
		},
		buzzIn: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.buzzIn(gameId, context.payload!.userId);
		},
		answerClue: async (_, { gameId, response }: { gameId: string; response: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.answerClue(gameId, context.payload!.userId, response);
		},
		protestResult: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.protestResult(gameId, context.payload!.userId);
		},
		voteOnResult: async (_, { gameId, vote }: { gameId: string; vote: boolean }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.voteOnResult(gameId, context.payload!.userId, vote);
		}
	},
	Subscription: {
		playGame: {
			subscribe: Engine.filterPlayGameSubs()
		}
	}
};
