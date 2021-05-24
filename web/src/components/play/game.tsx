import { gql, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useForm } from "react-hook-form";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";

import { Children, ErrorPage, LoadingPage } from "../shared";
import { usePlayGame } from "./usePlayGame";
import { GameObject, PlayerObject, ResultObject, RowObject } from "../../objects/play";
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

const PROTEST_RESULT = gql`
	mutation ProtestResult($gameId: String!) {
		protestResult(gameId: $gameId)
	}
`;

const SELECT_PROTEST = gql`
	mutation SelectProtest($gameId: String!, $index: Int!) {
		selectProtest(gameId: $gameId, index: $index)
	}
`;

const VOTE_ON_PROTEST = gql`
	mutation VoteOnProtest($gameId: String!, $vote: Boolean!) {
		voteOnProtest(gameId: $gameId, vote: $vote)
	}
`;

const Timer = ({ end }: { end?: number }) => {
	const [timeLeft, setTimeLeft] = useState((end || Date.now()) - Date.now());

	useEffect(() => {
		const timer = setTimeout(() => {
			setTimeLeft(timeLeft - 1000);
		}, 1000);

		return () => clearTimeout(timer);
	});

	return <h2>{`${Math.round(timeLeft / 1000)}`}</h2>;
};

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

const ProtestForm = ({ results, onSubmit }: { results: ResultObject[]; onSubmit?: (index: number) => void }) => {
	const resultString = (result: ResultObject): string => {
		return `${result.correct ? "Correct" : "Wrong"}: ${result.response}`;
	};

	return (
		<>
			{results.map((result, index) => (
				<h2 key={index}>
					<button
						onClick={() => {
							if (onSubmit) {
								onSubmit(index);
							}
						}}
						disabled={!onSubmit || result.protested}
					>
						{resultString(result)}
					</button>
				</h2>
			))}
		</>
	);
};

const VoteForm = ({ onSubmit }: { onSubmit: (vote: boolean) => void }) => (
	<h2>
		<button onClick={() => onSubmit(true)}>True</button>
		{"  "}
		<button onClick={() => onSubmit(false)}>False</button>
	</h2>
);

const PlayerCard = ({ active, player }: { active?: boolean; player: PlayerObject | null }) => {
	let className = "player";
	if (active) {
		className += " active";
	}
	if (player?.alreadyActed) {
		className += " alreadyActed";
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
	const [selectClueMutation] = useMutation<{}, { gameId: string; row: number; col: number }>(SELECT_CLUE);
	const [buzzInMutation] = useMutation<{}, { gameId: string }>(BUZZ_IN);
	const [answerClueMutation] = useMutation<{}, { gameId: string; response: string }>(ANSWER_CLUE);
	const [protestResultMutation] = useMutation<{}, { gameId: string }>(PROTEST_RESULT);
	const [selectProtestMutation] = useMutation<{}, { gameId: string; index: number }>(SELECT_PROTEST);
	const [voteOnProtestMutation] = useMutation<{}, { gameId: string; vote: boolean }>(VOTE_ON_PROTEST);
	const history = useHistory();

	const isActiveUser = (player: UserObject | PlayerObject | null): boolean => {
		return player?.id === game?.activePlayer;
	};

	const availableProtest = (game: GameObject): boolean => {
		if (!game.results) {
			return false;
		}

		return game.results.some((result: ResultObject) => {
			return !result.protested;
		});
	};

	const haventActed = (game: GameObject): boolean => {
		if (currentUser) {
			for (const player of game.players) {
				if (player && currentUser.id === player.id) {
					return !player.alreadyActed;
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

	const protestResult = async (): Promise<void> => {
		try {
			await protestResultMutation({
				variables: { gameId: gameId }
			});
		} catch (error) {
			console.error("protestResult", error);
		}
	};

	const selectProtest = async (index: number): Promise<void> => {
		try {
			await selectProtestMutation({
				variables: { gameId: gameId, index: index }
			});
		} catch (error) {
			console.error("selectProtest", error);
		}
	};

	const voteOnProtest = async (vote: boolean): Promise<void> => {
		try {
			await voteOnProtestMutation({
				variables: { gameId: gameId, vote: vote }
			});
		} catch (error) {
			console.error("voteOnProtest", error);
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
					<PlayerCard active={isActiveUser(player)} player={player} key={index} />
				))}
			</Row>

			{game.state === "AwaitingPlayers" ? (
				<Lightbox>
					<h1>Awaiting more players</h1>
				</Lightbox>
			) : game.state === "ShowingClue" ? (
				haventActed(game) ? (
					<Lightbox onClick={buzzIn}>
						<h1>{game.currentText!}</h1>
						<h2>Click to buzz-in</h2>
						<Timer key="ShowingClueHaventActed" end={game.timeout} />
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player to buzz-in</h2>
						<Timer key="ShowingClueHaveActed" end={game.timeout} />
					</Lightbox>
				)
			) : game.state === "AwaitingResponse" ? (
				isActiveUser(currentUser) ? (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<ResponseForm onSubmit={answerClue} />
						<h2>Waiting for your response</h2>
						<Timer key="AwaitingResponseActiveUser" end={game.timeout} />
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player's response</h2>
						<Timer key="AwaitingResponseInactiveUser" end={game.timeout} />
					</Lightbox>
				)
			) : game.state === "ShowingResult" ? (
				availableProtest(game) ? (
					<Lightbox onClick={protestResult}>
						<h1>{`Correct: ${game.currentText!}`}</h1>
						<h2>Click to protest result</h2>
						<Timer key="ShowingResultAvailableProtest" end={game.timeout} />
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{`Correct: ${game.currentText!}`}</h1>
						<h2>Waiting for timeout</h2>
						<Timer key="ShowingResultNoProtests" end={game.timeout} />
					</Lightbox>
				)
			) : game.state === "AwaitingProtest" ? (
				isActiveUser(currentUser) ? (
					<Lightbox>
						<h1>{`Correct: ${game.currentText!}`}</h1>
						<h2>Select result to protest:</h2>
						<ProtestForm results={game.results!} onSubmit={selectProtest} />
						<Timer key="AwaitingProtestActiveUser" end={game.timeout} />
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<h2>Waiting for other player's response</h2>
						<ProtestForm results={game.results!} />
						<Timer key="AwaitingProtestInactiveUser" end={game.timeout} />
					</Lightbox>
				)
			) : game.state === "VotingOnProtest" ? (
				haventActed(game) ? (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<ProtestForm results={game.results!} />
						<VoteForm onSubmit={voteOnProtest} />
						<Timer key="VerifyingResultHaventActed" end={game.timeout} />
					</Lightbox>
				) : (
					<Lightbox>
						<h1>{game.currentText!}</h1>
						<ProtestForm results={game.results!} />
						<h2>Waiting for other player to vote</h2>
						<Timer key="VerifyingResultHaveActed" end={game.timeout} />
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
