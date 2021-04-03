import { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";

import { AccessLevel } from "../../auth";
import { BoardModel, RecordModel, RecordType } from "../../models/build";
import { Alert, Error, Loading, Page } from "../shared";
import { RecordSelectModal } from "../build/recordSelect";
import { GameModel } from "../../models/play";
import { useCurrentUser } from "../user";

const GAMES = gql`
	query Games($allGames: Boolean!) {
		games(allGames: $allGames) {
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
	games: GameModel[];
	hostGame: string;
}

export const Play = () => {
	const currentUser = useCurrentUser();
	const [showAllGames, setShowAllGames] = useState(false);
	const [creatingGame, setCreatingGame] = useState(false);
	const [gameCreationError, setGameCreationError] = useState<string | undefined>(undefined);
	const history = useHistory();
	const { data, error, loading } = useQuery<Data, { allGames: boolean }>(GAMES, {
		fetchPolicy: "network-only",
		variables: {
			allGames: showAllGames
		}
	});
	const [hostMutation] = useMutation<Data, { boardId: string }>(HOST_GAME);

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
				<>
					{currentUser && currentUser?.access >= AccessLevel.Admin ? (
						<Form>
							<Form.Check
								id="showAllGamesSwitch"
								type="switch"
								label="Show all games"
								style={{ marginBottom: "0.5rem" }}
								defaultChecked={showAllGames}
								onChange={() => {
									setShowAllGames(!showAllGames);
								}}
							/>
						</Form>
					) : null}
				</>

				{data!.games.length > 0 ? (
					<Table striped bordered hover>
						<thead>
							<tr>
								<th style={{ width: "50%" }}>Name</th>
								<th style={{ width: "50%" }}>Started</th>
							</tr>
						</thead>
						<tbody>
							{data!.games.map((game: GameModel, index: number) => {
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
