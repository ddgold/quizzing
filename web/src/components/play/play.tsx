import React, { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";

import { BoardModel, RecordModel, RecordType } from "../../models/build";
import { Alert, Error, Loading, Page } from "../shared";
import { RecordSelectModal } from "../build/recordSelect";
import { GameModel } from "../../models/play";

const CURRENT_GAMES = gql`
	query CurrentGames {
		currentGames {
			id
			name
			started
		}
	}
`;

const HOST_GAME = gql`
	mutation HostGame($boardId: String!) {
		hostGame(boardId: $boardId)
	}
`;
interface Data {
	currentGames: GameModel[];
	hostGame: string;
}

interface Variables {
	boardId: string;
}

export const Play = () => {
	const [creatingGame, setCreatingGame] = useState(false);
	const [gameCreationError, setGameCreationError] = useState<string | undefined>(undefined);
	const history = useHistory();
	const { data, error, loading } = useQuery<Data>(CURRENT_GAMES, {
		fetchPolicy: "network-only"
	});
	const [hostMutation] = useMutation<Data, Variables>(HOST_GAME);

	const onSelect = async (record?: RecordModel) => {
		setCreatingGame(false);
		if (record) {
			try {
				const board = record as BoardModel;
				const result = await hostMutation({ variables: { boardId: board.id } });
				history.push(`/play/${result.data?.hostGame}`);
			} catch (error) {
				setGameCreationError(error.message);
				console.error(error);
			}
		}
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<>
			<Alert
				variant={"error"}
				show={!!gameCreationError}
				onDismiss={() => setGameCreationError(undefined)}
				autoClose={5000}
			>
				{gameCreationError!}
			</Alert>

			<Page title="Play" titleRight={<Button onClick={() => setCreatingGame(true)}>Host Game</Button>}>
				{data!.currentGames.length > 0 ? (
					<Table striped bordered hover>
						<thead>
							<tr>
								<th style={{ width: "50%" }}>Name</th>
								<th style={{ width: "50%" }}>Started</th>
							</tr>
						</thead>
						<tbody>
							{data!.currentGames.map((game: GameModel, index: number) => {
								const started = new Date(game.started);
								return (
									<tr key={index}>
										<td>
											<Link to={`play/${game.id}`}>{game.name}</Link>
										</td>
										<td>{started.toLocaleString()}</td>
									</tr>
								);
							})}
						</tbody>
					</Table>
				) : (
					<p className="lead" style={{ marginBottom: "0px" }}>
						No active games
					</p>
				)}

				<RecordSelectModal type={RecordType.Board} show={creatingGame} onSelect={onSelect} searchOnly />
			</Page>
		</>
	);
};
