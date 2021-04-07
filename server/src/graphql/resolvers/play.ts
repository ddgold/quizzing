import { ForbiddenError } from "apollo-server-errors";
import { IResolvers } from "graphql-tools";

import { AccessLevel, assertHttpToken, Context } from "../../auth";
import Engine, { GameModel } from "../../engine";
import { GameFilter } from "../types";

export const PlayResolvers: IResolvers<any, Context> = {
	Query: {
		games: async (_, { filter }: { filter: GameFilter }, context): Promise<GameModel[]> => {
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
		playGame: async (_, { gameId }: { gameId: string }, context): Promise<GameModel> => {
			await assertHttpToken(context, AccessLevel.User);

			if (!(await Engine.canPlayGame(gameId, context.payload!.userId))) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}

			return Engine.loadGameModel(gameId);
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

			if (!(await Engine.canPlayGame(gameId, context.payload!.userId))) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}

			return Engine.selectClue(gameId, row, col);
		},
		answerClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);

			if (!(await Engine.canPlayGame(gameId, context.payload!.userId))) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}

			return Engine.answerClue(gameId);
		},
		closeClue: async (_, { gameId }: { gameId: string }, context): Promise<void> => {
			await assertHttpToken(context, AccessLevel.User);

			if (!(await Engine.canPlayGame(gameId, context.payload!.userId))) {
				throw new ForbiddenError(`Can't access game with id '${gameId}'`);
			}

			return Engine.closeClue(gameId);
		}
	},
	Subscription: {
		playGame: {
			subscribe: Engine.filterPlayGameSubs()
		}
	}
};
