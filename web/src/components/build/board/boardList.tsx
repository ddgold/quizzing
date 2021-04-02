import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../../shared";
import { RecordSelectModal } from "../recordSelect";
import { BoardModel, RecordModel, RecordType } from "../../../models/build";

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

interface Data {
	boards: BoardModel[];
}

interface Props {
	showAll: boolean;
}

export const BoardList = ({ showAll }: Props) => {
	const [selectingBoard, setSelectingBoard] = useState(false);
	const history = useHistory();
	const { data, error, loading } = useQuery<Data, Props>(BOARDS, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	const onSelect = (record?: RecordModel) => {
		setSelectingBoard(false);
		if (record) {
			const board = record as BoardModel;
			history.push(`/build/boards/${board.id}`);
		}
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page
			title={showAll ? "All Boards" : "My Boards"}
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
					{data!.boards.map((board: BoardModel, index: number) => {
						const created = new Date(board.created);
						return (
							<tr key={index}>
								<td>
									<Link to={`/build/boards/${board.id}`}>{board.name}</Link>
								</td>
								<td>
									{showAll ? `${created.toLocaleString()} by ${board.creator.nickname}` : created.toLocaleString()}
								</td>
							</tr>
						);
					})}
				</tbody>
			</Table>

			<RecordSelectModal type={RecordType.Board} show={selectingBoard} onSelect={onSelect} createOnly />
		</Page>
	);
};
