import React from "react";
import { gql, useSubscription } from "@apollo/client";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { Error, Loading, Page } from "../shared";

const PLAY_GAME = gql`
	subscription PlayGame($id: String!) {
		playGame(id: $id)
	}
`;

interface Data {
	playGame: string;
}

interface Variables {
	id: string;
}

interface Props extends RouteComponentProps {}

export const GameWithoutRouter = (props: Props) => {
	const { data, error, loading } = useSubscription<Data, Variables>(PLAY_GAME, {
		variables: { id: (props.match.params as Variables).id }
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	console.log(data);

	return (
		<Page title="Game">
			<p className="lead" style={{ marginBottom: "0px" }}>
				{data!.playGame}
			</p>
		</Page>
	);
};

export const Game = withRouter(GameWithoutRouter);
