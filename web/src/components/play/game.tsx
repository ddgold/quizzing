import React from "react";
import { Container } from "react-bootstrap";
import { gql, useSubscription } from "@apollo/client";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { Error, Loading } from "../shared";
import { GameModel, RowModel } from "../../models/play";

import "./game.scss";

const PLAY_GAME = gql`
	subscription PlayGame($id: String!) {
		playGame(id: $id) {
			categories
			rows {
				cols
				value
			}
		}
	}
`;

interface Data {
	playGame: GameModel;
}

interface Variables {
	id: string;
}

interface Props extends RouteComponentProps {}

const GameWithoutRouter = (props: Props) => {
	const { data, error, loading } = useSubscription<Data, Variables>(PLAY_GAME, {
		variables: { id: (props.match.params as Variables).id }
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}
	return (
		<Container className="board" fluid>
			<h1>{(props.match.params as Variables).id}</h1>
			<table>
				<thead>
					<tr>
						{data!.playGame.categories.map((category: string, index: number) => (
							<th key={index}>
								<div>{category}</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data!.playGame.rows.map((row: RowModel, index: number) => (
						<tr key={index}>
							{row.cols.map((seen: boolean, index: number) => (
								<td key={index}>{!seen ? row.value : ""}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</Container>
	);
};

export const Game = withRouter(GameWithoutRouter);
