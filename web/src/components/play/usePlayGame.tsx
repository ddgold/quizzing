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
		}
	}
`;

interface Data {
	playGame: GameModel;
}

interface Props {
	gameId: string;
}

interface Result {
	loading: boolean;
	error: ApolloError | undefined;
	game: GameModel | undefined;
}

export const usePlayGame = (gameId: string): Result => {
	const query = useQuery<Data, Props>(QUERY, {
		fetchPolicy: "network-only",
		variables: { gameId: gameId }
	});
	const sub = useSubscription<Data, Props>(SUBSCRIPTION, {
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
