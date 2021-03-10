import React from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../../shared";
import { RecordSelect } from "../recordSelect";
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
	const history = useHistory();
	const { data, error, loading } = useQuery<Data, Props>(BOARDS, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	const onSelect = (record: RecordModel) => {
		const board = record as BoardModel;
		history.push(`/boards/id/${board.id}`);
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
				<RecordSelect type={RecordType.Board} onSelect={onSelect} createOnly>
					<Button variant="primary">Create New</Button>
				</RecordSelect>
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
									<Link to={"/boards/id/" + board.id}>{board.name}</Link>
								</td>
								<td>
									{showAll ? `${created.toLocaleString()} by ${board.creator.nickname}` : created.toLocaleString()}
								</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Page>
	);
};
