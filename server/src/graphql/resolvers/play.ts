import { IResolvers } from "graphql-tools";

import { assertHttpAuthorized, Context } from "../../auth";
import Engine, { GameModel } from "../../engine";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		currentGames: async (_, __, context): Promise<GameModel[]> => {
			await assertHttpAuthorized(context);
			return Engine.usersGames(context.payload!.userId);
		},
		playGame: async (_, { gameId }: { gameId: string }, context): Promise<GameModel> => {
			await assertHttpAuthorized(context);
			return Engine.game(gameId);
		}
	},
	Mutation: {
		hostGame: async (_, { boardId }: { boardId: string }, context): Promise<string> => {
			await assertHttpAuthorized(context);
			return Engine.host(boardId, context.payload!.userId);
		},
		joinGame: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			return Engine.join(gameId, context.payload!.userId);
		},
		selectClue: async (
			_,
			{ gameId, row, col }: { gameId: string; row: number; col: number },
			context
		): Promise<void> => {
			await assertHttpAuthorized(context);
			return Engine.selectClue(gameId, row, col);
		},
		answerClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			return Engine.answerClue(gameId);
		},
		closeClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpAuthorized(context);
			return Engine.closeClue(gameId);
		}
	},
	Subscription: {
		playGame: {
			subscribe: Engine.filterPlayGameSubs()
		}
	}
};
