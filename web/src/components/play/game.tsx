import React from "react";
import { Container } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { Error, Loading } from "../shared";
import { usePlayGame } from "./usePlayGame";

import "./game.scss";

const SELECT_CLUE = gql`
	mutation SelectClue($id: String!, $row: Int!, $col: Int!) {
		selectClue(id: $id, row: $row, col: $col)
	}
`;

const ANSWER_CLUE = gql`
	mutation AnswerClue($id: String!) {
		answerClue(id: $id)
	}
`;

const CLOSE_CLUE = gql`
	mutation CloseClue($id: String!) {
		closeClue(id: $id)
	}
`;

interface Variables {
	id: string;
	row?: number;
	col?: number;
}

interface Props extends RouteComponentProps {}

const GameWithoutRouter = (props: Props) => {
	const boardId = (props.match.params as Variables).id;
	const [loading, error, game] = usePlayGame(boardId);

	const [selectClueMutation] = useMutation<{}, Variables>(SELECT_CLUE);
	const [answerClueMutation] = useMutation<{}, Variables>(ANSWER_CLUE);
	const [closeClueMutation] = useMutation<{}, Variables>(CLOSE_CLUE);

	const selectClue = async (row: number, col: number) => {
		try {
			await selectClueMutation({
				variables: { id: boardId, row: row, col: col }
			});
		} catch (error) {
			console.error("selectCell", error);
		}
	};

	const answerClue = async () => {
		try {
			await answerClueMutation({
				variables: { id: boardId }
			});
		} catch (error) {
			console.error("answerClue", error);
		}
	};

	const closeClue = async () => {
		try {
			await closeClueMutation({
				variables: { id: boardId }
			});
		} catch (error) {
			console.error("closeLightbox", error);
		}
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	if (!game) {
		return <Error message={"Game not found"} />;
	}

	return (
		<Container className="board" fluid>
			<h1>{boardId}</h1>
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
					{game.rows.map((row: { value: number; cols: boolean[] }, rowIndex: number) => (
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
			{game.activeClue ? (
				<div className="lightbox">
					<div onClick={() => (game.activeClue?.showingAnswer ? answerClue() : closeClue())}>
						<p>{`${game.activeClue.text} ${game.activeClue.showingAnswer}`}</p>
					</div>
				</div>
			) : undefined}
		</Container>
	);
};

export const Game = withRouter(GameWithoutRouter);