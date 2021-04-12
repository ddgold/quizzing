import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { ErrorPage, LoadingPage, Page } from "../../shared";
import { RecordSelectModal } from "../recordSelect";
import { BoardObject, RecordObject, RecordType } from "../../../objects/build";

const BOARDS = gql`
	query Boards($showAll: Boolean!) {
		boards(showAll: $showAll) {
			id
			name
			created
			creator {
				nickname
			}
		}
	}
`;

export const BoardList = ({ showAll }: { showAll: boolean }) => {
	const [selectingBoard, setSelectingBoard] = useState(false);
	const history = useHistory();
	const { data, error, loading } = useQuery<{ boards: BoardObject[] }, { showAll: boolean }>(BOARDS, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	const onSelect = (record?: RecordObject) => {
		setSelectingBoard(false);
		if (record) {
			const board = record as BoardObject;
			history.push(`/build/boards/${board.id}`);
		}
	};

	const title = showAll ? "All Boards" : "My Boards";

	return loading ? (
		<LoadingPage title={title} />
	) : error || !data ? (
		<ErrorPage message={error?.message} />
	) : (
		<Page
			title={title}
			titleRight={
				<Button variant="primary" onClick={() => setSelectingBoard(true)}>
					Create New
				</Button>
			}
		>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th style={{ width: "50%" }}>Name</th>
						<th style={{ width: "50%" }}>Created</th>
					</tr>
				</thead>
				<tbody>
					{data.boards.map((board: BoardObject, index: number) => {
						const created = new Date(board.created);
						return (
							<tr key={index}>
								<td>
									<Link to={`/build/boards/${board.id}`}>{board.name}</Link>
								</td>
								<td>{showAll ? `${created.toLocaleString()} by ${board.creator.nickname}` : created.toLocaleString()}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>

			<RecordSelectModal type={RecordType.Board} show={selectingBoard} onSelect={onSelect} createOnly />
		</Page>
	);
};
