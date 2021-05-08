import { gql, useMutation } from "@apollo/client";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useForm } from "react-hook-form";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";

import { Children, ErrorPage, LoadingPage } from "../shared";
import { usePlayGame } from "./usePlayGame";
import { GameObject, PlayerObject, RowObject } from "../../objects/play";
import { UserObject } from "../../objects/user";
import { useCurrentUser } from "../user";

import "./game.scss";

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
	mutation AnswerClue($gameId: String!, $response: String!) {
		answerClue(gameId: $gameId, response: $response)
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

const ResponseForm = ({ onSubmit }: { onSubmit: (response: string) => void }) => {
	const {
		handleSubmit,
		register,
		formState: { errors }
	} = useForm<{ response: string }>();

	return (
		<form onSubmit={handleSubmit(({ response }) => onSubmit(response))}>
			<input
				className="responseInput"
				{...register("response", {
					required: {
						value: true,
						message: `Response is required`
					},
					maxLength: {
						value: 64,
						message: `Response must be at most 64 characters`
					}
				})}
				placeholder={`Enter response`}
			/>
			{errors.response ? <p className="responseError">{errors.response.message}</p> : null}
			<input type="submit" style={{ display: "none" }} />
		</form>
	);
};

const PlayerCard = ({ active, alreadyGuessed, player }: { active?: boolean; alreadyGuessed?: boolean; player: PlayerObject | null }) => {
	let className = "player";
	if (active) {
		className += " active";
	}
	if (alreadyGuessed) {
		className += " alreadyGuessed";
	}

	return (
		<Col className={className}>
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
};

export const Game = withRouter((props: RouteComponentProps) => {
	const gameId = (props.match.params as { gameId: string }).gameId;
	const currentUser = useCurrentUser();
	const { loading, error, game } = usePlayGame(gameId);
	const [selectClueMutation] = useMutation<{}, { gameId: string; row?: number; col?: number }>(SELECT_CLUE);
	const [buzzInMutation] = useMutation<{}, { gameId: string }>(BUZZ_IN);
	const [answerClueMutation] = useMutation<{}, { gameId: string; response: string }>(ANSWER_CLUE);
	const [closeClueMutation] = useMutation<{}, { gameId: string }>(CLOSE_CLUE);
	const history = useHistory();

	const isActiveUser = (player: UserObject | PlayerObject | null): boolean => {
		return player?.id === game?.activePlayer;
	};

	const alreadyGuessed = (game: GameObject): boolean => {
		if (currentUser) {
			for (const player of game.players) {
				if (player && currentUser.id === player.id) {
					return player.alreadyGuessed;
				}
			}
		}

		return false;
	};

	const selectClue = async (row: number, col: number): Promise<void> => {
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

	const answerClue = async (response: string): Promise<void> => {
		try {
			await answerClueMutation({
				variables: { gameId: gameId, response: response }
			});
		} catch (error) {
			console.error("answerClue", error);
		}
	};

	const closeClue = async (): Promise<void> => {
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
										<td
											key={colIndex}
											onClick={async () => {
												if (isActiveUser(currentUser)) {
													await selectClue(rowIndex, colIndex);
												}
											}}
										>
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
					<PlayerCard active={isActiveUser(player)} alreadyGuessed={player?.alreadyGuessed} key={index} player={player} />
				))}
			</Row>

			{game.state === "AwaitingPlayers" ? (
				<Lightbox>
					<h1>Awaiting more players</h1>
				</Lightbox>
			) : game.state === "ShowingAnswer" ? (
				alreadyGuessed(game) ? (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player to buzz-in </h2>
					</Lightbox>
				) : (
					<Lightbox onClick={buzzIn}>
						<h1>{game.currentText!}</h1>
						<h2>Click to buzz-in</h2>
					</Lightbox>
				)
			) : game.state === "AwaitingResponse" ? (
				isActiveUser(currentUser) ? (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<ResponseForm onSubmit={answerClue} />
						<h2>Waiting for your response</h2>
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player's response</h2>
					</Lightbox>
				)
			) : game.state === "ShowingQuestion" ? (
				isActiveUser(currentUser) ? (
					<Lightbox onClick={closeClue}>
						<h1>{game.currentText!}</h1>
						<h2>Click to close clue</h2>
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player to close clue</h2>
					</Lightbox>
				)
			) : gameDone(game) ? (
				<Lightbox onClick={() => history.push("/play")}>
					<h1>Game Over!</h1>
				</Lightbox>
			) : null}
		</Container>
	);
});
