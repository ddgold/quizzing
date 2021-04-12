import { Col, Container, Row } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";

import { Children, ErrorPage, LoadingPage } from "../shared";
import { usePlayGame } from "./usePlayGame";
import { GameObject, PlayerObject, RowObject } from "../../objects/play";
import { useCurrentUser } from "../user";

import "./game.scss";
import { UserObject } from "src/objects/user";

const SELECT_CLUE = gql`
	mutation SelectClue($gameId: String!, $row: Int!, $col: Int!) {
		selectClue(gameId: $gameId, row: $row, col: $col)
	}
`;

const BUZZ_IN = gql`
	mutation BuzzIn($gameId: String!) {
		buzzIn(gameId: $gameId)
	}
`;

const ANSWER_CLUE = gql`
	mutation AnswerClue($gameId: String!) {
		answerClue(gameId: $gameId)
	}
`;

const CLOSE_CLUE = gql`
	mutation CloseClue($gameId: String!) {
		closeClue(gameId: $gameId)
	}
`;

const Lightbox = ({ onClick, children }: { onClick?: () => void; children: Children }) => {
	return (
		<div className="lightbox">
			<div onClick={onClick}>{children}</div>
		</div>
	);
};

const PlayerCard = ({ active, player }: { active?: boolean; player: PlayerObject | null }) => (
	<Col className={active ? "player active" : "player"}>
		{player ? (
			<div>
				{player.nickname}
				<br />
				{player.score}
			</div>
		) : (
			<div>{"null"}</div>
		)}
	</Col>
);

export const Game = withRouter((props: RouteComponentProps) => {
	const gameId = (props.match.params as { gameId: string }).gameId;
	const currentUser = useCurrentUser();
	const { loading, error, game } = usePlayGame(gameId);
	const [selectClueMutation] = useMutation<{}, { gameId: string; row?: number; col?: number }>(SELECT_CLUE);
	const [buzzInMutation] = useMutation<{}, { gameId: string }>(BUZZ_IN);
	const [answerClueMutation] = useMutation<{}, { gameId: string }>(ANSWER_CLUE);
	const [closeClueMutation] = useMutation<{}, { gameId: string }>(CLOSE_CLUE);
	const history = useHistory();

	const isActiveUser = (player: UserObject | PlayerObject | null): boolean => {
		return player?.id === game?.activePlayer;
	};

	const selectClue = async (row: number, col: number): Promise<void> => {
		if (!isActiveUser(currentUser)) {
			return;
		}

		try {
			await selectClueMutation({
				variables: { gameId: gameId, row: row, col: col }
			});
		} catch (error) {
			console.error("selectCell", error);
		}
	};

	const buzzIn = async (): Promise<void> => {
		try {
			await buzzInMutation({
				variables: { gameId: gameId }
			});
		} catch (error) {
			console.error("buzzIn", error);
		}
	};

	const answerClue = async (): Promise<void> => {
		if (!isActiveUser(currentUser)) {
			return;
		}

		try {
			await answerClueMutation({
				variables: { gameId: gameId }
			});
		} catch (error) {
			console.error("answerClue", error);
		}
	};

	const closeClue = async (): Promise<void> => {
		if (!isActiveUser(currentUser)) {
			return;
		}

		try {
			await closeClueMutation({
				variables: { gameId: gameId }
			});
		} catch (error) {
			console.error("closeLightbox", error);
		}
	};

	const gameDone = (game: GameObject): boolean => {
		for (const row of game.rows) {
			for (const selected of row.cols) {
				if (!selected) {
					return false;
				}
			}
		}
		return true;
	};

	return loading ? (
		<LoadingPage />
	) : error ? (
		<ErrorPage message={error.message} />
	) : !game ? (
		<ErrorPage message={"Game not found"} />
	) : (
		<Container className="board" fluid>
			<h1>{game.name}</h1>

			<table>
				<thead>
					<tr>
						{game.categories.map((category: string, index: number) => (
							<th key={index}>
								<div>{category}</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{game.rows.map((row: RowObject, rowIndex: number) => (
						<tr key={rowIndex}>
							{row.cols.map((selected: boolean, colIndex: number) => {
								if (!selected) {
									return (
										<td key={colIndex} onClick={() => selectClue(rowIndex, colIndex)}>
											{row.value}
										</td>
									);
								} else {
									return <td key={colIndex} />;
								}
							})}
						</tr>
					))}
				</tbody>
			</table>

			<Row>
				{game.players.map((player, index) => (
					<PlayerCard active={isActiveUser(player)} key={index} player={player} />
				))}
			</Row>

			{game.state === "AwaitingPlayers" ? (
				<Lightbox>
					<h1>Awaiting more players</h1>
				</Lightbox>
			) : game.state === "ShowingAnswer" ? (
				<Lightbox onClick={buzzIn}>
					<h1>{game.currentText!}</h1>
					<h2>Click to buzz-in</h2>
				</Lightbox>
			) : game.state === "AwaitingResponse" ? (
				<Lightbox onClick={answerClue}>
					<h1>{game.currentText!}</h1>
					<h2>{isActiveUser(currentUser) ? "Waiting for your response" : "Waiting for other player's response"}</h2>
				</Lightbox>
			) : game.state === "ShowingQuestion" ? (
				<Lightbox onClick={closeClue}>
					<h1>{game.currentText!}</h1>
					<h2>{isActiveUser(currentUser) ? "Click to close clue" : "Waiting for other player to close clue"}</h2>
				</Lightbox>
			) : gameDone(game) ? (
				<Lightbox onClick={() => history.push("/play")}>
					<h1>Game Over!</h1>
				</Lightbox>
			) : null}
		</Container>
	);
});
