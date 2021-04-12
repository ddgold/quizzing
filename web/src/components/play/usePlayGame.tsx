import { ApolloError, gql, useQuery, useSubscription } from "@apollo/client";

import { GameModel } from "../../models/play";

const QUERY = gql`
	query PlayGame($gameId: String!) {
		playGame(gameId: $gameId) {
			name
			categories
			rows {
				cols
				value
			}
			state
			currentText
			activePlayer
			players {
				id
				nickname
				score
			}
		}
	}
`;

const SUBSCRIPTION = gql`
	subscription PlayGame($gameId: String!) {
		playGame(gameId: $gameId) {
			name
			categories
			rows {
				cols
				value
			}
			state
			currentText
			activePlayer
			players {
				id
				nickname
				score
			}
		}
	}
`;

export const usePlayGame = (gameId: string): { loading: boolean; error?: ApolloError; game?: GameModel } => {
	const query = useQuery<{ playGame: GameModel }, { gameId: string }>(QUERY, {
		fetchPolicy: "network-only",
		nextFetchPolicy: "standby",
		variables: { gameId: gameId }
	});
	const sub = useSubscription<{ playGame: GameModel }, { gameId: string }>(SUBSCRIPTION, {
		variables: { gameId: gameId }
	});

	if (query.error || sub.error) {
		return { loading: false, error: query.error || sub.error, game: undefined };
	}

	if (query.loading && sub.loading) {
		return { loading: true, error: undefined, game: undefined };
	}

	return { loading: false, error: undefined, game: sub.data?.playGame || query.data?.playGame };
};
