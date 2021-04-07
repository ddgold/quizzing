import { gql, useQuery } from "@apollo/client";
import { useState } from "react";
import { Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

import { AccessLevel } from "../../auth";
import { Error, Loading, Page } from "../shared";
import { GameFilter, GameModel } from "../../models/play";
import { useCurrentUser } from "../user";

const GAMES = gql`
	query Games($filter: Int!) {
		games(filter: $filter) {
			id
			name
			started
		}
	}
`;
export const CurrentGames = () => {
	const currentUser = useCurrentUser();
	const [showAllGames, setShowAllGames] = useState(false);
	const { data, error, loading } = useQuery<{ games: GameModel[] }, { filter: GameFilter }>(GAMES, {
		fetchPolicy: "network-only",
		variables: {
			filter: showAllGames ? GameFilter.All : GameFilter.User
		}
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page title="Current Games">
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
										<Link to={`play/${game.id}`}>{game.id}</Link>
									</td>
									<td>{started.toLocaleString()}</td>
								</tr>
							);
						})}
					</tbody>
				</Table>
			) : (
				<p className="lead" style={{ marginBottom: "0px" }}>
					You don't have any active games
				</p>
			)}
		</Page>
	);
};
