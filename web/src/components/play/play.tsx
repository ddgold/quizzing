import { gql, useMutation, useQuery } from "@apollo/client";
import React from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";

import { BoardModel, RecordModel, RecordType } from "../../models/build";
import { Error, Loading, Page } from "../shared";
import { RecordSelect } from "../build/recordSelect";
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
	const history = useHistory();
	const { data, error, loading } = useQuery<Data>(CURRENT_GAMES, {
		fetchPolicy: "network-only"
	});
	const [hostMutation] = useMutation<Data, Variables>(HOST_GAME);

	const onSelect = async (record: RecordModel) => {
		const board = record as BoardModel;
		const result = await hostMutation({ variables: { boardId: board.id } });
		history.push(`/play/${result.data?.hostGame}`);
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page
			title="Play"
			titleRight={
				<RecordSelect type={RecordType.Board} onSelect={onSelect} searchOnly>
					<Button>Host Game</Button>
				</RecordSelect>
			}
		>
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
		</Page>
	);
};
