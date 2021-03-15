import { ApolloError, gql, useQuery, useSubscription } from "@apollo/client";

import { GameModel } from "../../models/play";

const QUERY = gql`
	query PlayGame($id: String!) {
		playGame(id: $id) {
			categories
			rows {
				cols
				value
			}
			activeClue {
				text
				showingAnswer
			}
		}
	}
`;

const SUBSCRIPTION = gql`
	subscription PlayGame($id: String!) {
		playGame(id: $id) {
			categories
			rows {
				cols
				value
			}
			activeClue {
				text
				showingAnswer
			}
		}
	}
`;

interface Data {
	playGame: GameModel;
}

interface Props {
	id: string;
}

export const usePlayGame = (
	id: string
): [loading: boolean, error: ApolloError | undefined, game: GameModel | undefined] => {
	const query = useQuery<Data, Props>(QUERY, {
		fetchPolicy: "network-only",
		variables: { id: id }
	});
	const sub = useSubscription<Data, Props>(SUBSCRIPTION, {
		variables: { id: id }
	});

	if (query.error || sub.error) {
		return [false, query.error || sub.error, undefined];
	}

	if (query.loading && sub.loading) {
		return [true, undefined, undefined];
	}

	return [false, undefined, sub.data?.playGame || query.data?.playGame];
};
