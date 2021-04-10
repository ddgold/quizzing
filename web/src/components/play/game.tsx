import { Container } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";

import { ErrorPage, LoadingPage } from "../shared";
import { usePlayGame } from "./usePlayGame";
import { GameModel, RowModel } from "../../models/play";

import "./game.scss";

const SELECT_CLUE = gql`
	mutation SelectClue($gameId: String!, $row: Int!, $col: Int!) {
		selectClue(gameId: $gameId, row: $row, col: $col)
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

export const Game = withRouter((props: RouteComponentProps) => {
	const gameId = (props.match.params as { gameId: string }).gameId;
	const { loading, error, game } = usePlayGame(gameId);
	const [selectClueMutation] = useMutation<{}, { gameId: string; row?: number; col?: number }>(SELECT_CLUE);
	const [answerClueMutation] = useMutation<{}, { gameId: string }>(ANSWER_CLUE);
	const [closeClueMutation] = useMutation<{}, { gameId: string }>(CLOSE_CLUE);
	const history = useHistory();

	const selectClue = async (row: number, col: number): Promise<void> => {
		try {
			await selectClueMutation({
				variables: { gameId: gameId, row: row, col: col }
			});
		} catch (error) {
			console.error("selectCell", error);
		}
	};

	const answerClue = async (): Promise<void> => {
		try {
			await answerClueMutation({
				variables: { gameId: gameId }
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

	const gameDone = (game: GameModel): boolean => {
		for (const row of game.rows) {
			for (const selected of row.cols) {
				if (!selected) {
					return false;
				}
			}
		}
		return true;
	};

	const lightbox = (text: string, onClick: () => void) => (
		<div className="lightbox">
			<div onClick={onClick}>
				<p>{text}</p>
			</div>
		</div>
	);

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
					{game.rows.map((row: RowModel, rowIndex: number) => (
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
			{game.currentText
				? lightbox(game.currentText, () => {
						game.state === "ShowingAnswer" ? answerClue() : closeClue();
				  })
				: gameDone(game)
				? lightbox("Game Over!", () => {
						history.push("/play");
				  })
				: null}
		</Container>
	);
});
