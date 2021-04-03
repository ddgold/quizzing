import { IResolvers } from "graphql-tools";

import { AccessLevel, assertHttpToken, Context } from "../../auth";
import Engine, { GameModel } from "../../engine";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		games: async (_, { allGames }: { allGames: boolean }, context): Promise<GameModel[]> => {
			if (allGames) {
				await assertHttpToken(context, AccessLevel.Admin);
				return Engine.allGames();
			} else {
				await assertHttpToken(context, AccessLevel.User);
				return Engine.usersGames(context.payload!.userId);
			}
		},
		playGame: async (_, { gameId }: { gameId: string }, context): Promise<GameModel> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.game(gameId);
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
		selectClue: async (
			_,
			{ gameId, row, col }: { gameId: string; row: number; col: number },
			context
		): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.selectClue(gameId, row, col);
		},
		answerClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.answerClue(gameId);
		},
		closeClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);
			return Engine.closeClue(gameId);
		}
	},
	Subscription: {
		playGame: {
			subscribe: Engine.filterPlayGameSubs()
		}
	}
};
