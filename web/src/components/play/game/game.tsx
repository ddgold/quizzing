import { gql, useMutation } from "@apollo/client";
import Container from "react-bootstrap/Container";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";

import { Gameboard } from "./gameboard";
import { Lightbox, ProtestForm, ResponseForm, VoteForm } from "./lightbox";
import { Scoreboard } from "./scoreboard";
import { usePlayGame } from "./usePlayGame";
import { GameObject, PlayerObject, ResultObject } from "../../../objects/play";
import { UserObject } from "../../../objects/user";
import { ErrorPage, LoadingPage } from "../../shared";
import { useCurrentUser } from "../../user";

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

	const remainingSpots = (game: GameObject): number => {
		return game.players.filter((player) => !player).length;
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

	const result = (game: GameObject): string[] => {
		return game.players
			.sort((lhs: PlayerObject | null, rhs: PlayerObject | null) => {
				if (lhs === null && rhs === null) {
					return 0;
				} else if (lhs === null) {
					return 1;
				} else if (rhs === null) {
					return -1;
				} else if (lhs.score === rhs.score) {
					return 0;
				} else if (lhs.score < rhs.score) {
					return 1;
				} else {
					return -1;
				}
			})
			.map((player: PlayerObject | null) => {
				return player ? `${player.nickname} - ${player.score}` : "Unknown - 0";
			});
	};

	return loading ? (
		<LoadingPage />
	) : error ? (
		<ErrorPage message={error.message} />
	) : !game ? (
		<ErrorPage message={"Game not found"} />
	) : (
		<Container className="game" fluid>
			<h1>{game.name}</h1>

			<Gameboard
				categories={game.categories}
				rows={game.rows}
				onSelection={async (rowIndex: number, colIndex: number) => {
					if (isActiveUser(currentUser)) {
						await selectClue(rowIndex, colIndex);
					}
				}}
			/>

			<Scoreboard
				players={game.players}
				isActive={(player: PlayerObject | null) => {
					return isActiveUser(player);
				}}
			/>

			{game.state === "AwaitingPlayers" ? (
				<Lightbox title="Awaiting more players...">
					<>{`Game will start when ${remainingSpots(game)} more players join.`}</>
				</Lightbox>
			) : game.state === "ShowingClue" ? (
				haventActed(game) ? (
					<Lightbox title="Click to buzz-in!" timeout={game.timeout} onClick={buzzIn}>
						<h1>{game.currentText!}</h1>
					</Lightbox>
				) : (
					<Lightbox title="Waiting for other player to buzz-in..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
					</Lightbox>
				)
			) : game.state === "AwaitingResponse" ? (
				isActiveUser(currentUser) ? (
					<Lightbox title="Waiting for your response..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
						<ResponseForm onSubmit={answerClue} />
					</Lightbox>
				) : (
					<Lightbox title="Waiting for other player's response..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
					</Lightbox>
				)
			) : game.state === "ShowingResult" ? (
				availableProtest(game) ? (
					<Lightbox title="Click to protest result..." timeout={game.timeout} onClick={protestResult}>
						<h1>{`Correct: ${game.currentText!}`}</h1>
					</Lightbox>
				) : (
					<Lightbox title="Waiting for timeout" timeout={game.timeout}>
						<h1>{`Correct: ${game.currentText!}`}</h1>
					</Lightbox>
				)
			) : game.state === "AwaitingProtest" ? (
				isActiveUser(currentUser) ? (
					<Lightbox title="Select result to protest:" timeout={game.timeout}>
						<h1>{`Correct: ${game.currentText!}`}</h1>
						<ProtestForm results={game.results!} onSubmit={selectProtest} />
					</Lightbox>
				) : (
					<Lightbox title="Waiting for other player's response..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
						<ProtestForm results={game.results!} />
					</Lightbox>
				)
			) : game.state === "VotingOnProtest" ? (
				haventActed(game) ? (
					<Lightbox title="Vote Yah! or Nah for protest..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
						<ProtestForm results={game.results!} />
						<VoteForm onSubmit={voteOnProtest} />
					</Lightbox>
				) : (
					<Lightbox title="Waiting for other player to vote..." timeout={game.timeout}>
						<h1>{game.currentText!}</h1>
						<ProtestForm results={game.results!} />
					</Lightbox>
				)
			) : gameDone(game) ? (
				<Lightbox title="Game Over" onClick={() => history.push("/play")}>
					{result(game).map((result: string, index: number) => (
						<p key={index}>{result}</p>
					))}
				</Lightbox>
			) : null}
		</Container>
	);
});
