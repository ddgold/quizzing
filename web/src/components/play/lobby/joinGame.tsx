import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { BsArrowClockwise } from "react-icons/bs";
import { useHistory } from "react-router-dom";

import { Alert, IconButton, Error, Loading } from "../../shared";
import { GameFilter, GameObject } from "../../../objects/play";
import { Page } from "../../shared";

const GAMES = gql`
	query Games($filter: Int!) {
		games(filter: $filter) {
			id
			name
			started
		}
	}
`;

const JOIN_GAME = gql`
	mutation JoinGame($gameId: String!) {
		joinGame(gameId: $gameId)
	}
`;

export const JoinGame = () => {
	const [joinGameError, setJoinGameError] = useState<string | undefined>(undefined);
	const { data, error, loading, refetch } = useQuery<{ games: GameObject[] }, { filter: GameFilter }>(GAMES, {
		fetchPolicy: "network-only",
		variables: {
			filter: GameFilter.Public
		}
	});
	const [joinGameMutation] = useMutation<{}, { gameId: string }>(JOIN_GAME);
	const history = useHistory();

	const onJoinGame = async (gameId: string) => {
		try {
			await joinGameMutation({ variables: { gameId: gameId } });
			history.push(`/play/${gameId}`);
		} catch (error) {
			setJoinGameError(error.message);
		}
	};

	return (
		<>
			<Alert variant={"error"} show={!!joinGameError} onDismiss={() => setJoinGameError(undefined)} autoClose={5000}>
				{joinGameError!}
			</Alert>

			<Page
				title="Join Game"
				titleRight={
					<IconButton onClick={() => refetch()}>
						<BsArrowClockwise />
					</IconButton>
				}
			>
				{loading ? (
					<Loading />
				) : error || !data ? (
					<Error message={error?.message} />
				) : data.games.length > 0 ? (
					<Table striped bordered hover>
						<thead>
							<tr>
								<th style={{ width: "45%" }}>Name</th>
								<th style={{ width: "45%" }}>Started</th>
							</tr>
						</thead>
						<tbody>
							{data.games.map((game: GameObject, index: number) => {
								const started = new Date(game.started);
								return (
									<tr key={index}>
										<td>
											<Button
												variant="link"
												onClick={() => {
													onJoinGame(game.id);
												}}
												style={{ padding: 0, textAlign: "left" }}
											>
												{game.id}
											</Button>
										</td>
										<td>{started.toLocaleString()}</td>
									</tr>
								);
							})}
						</tbody>
					</Table>
				) : (
					<p className="lead" style={{ marginBottom: "0px" }}>
						No public games looking for players
					</p>
				)}
			</Page>
		</>
	);
};
