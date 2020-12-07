import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { CreateBoard, Error, Loading, Page } from "../..";
import { BoardModel } from "../../../models/build";

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
	const { data, error, loading } = useQuery<Data, Props>(BOARDS, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page title={showAll ? "All Boards" : "My Boards"} titleRight={<CreateBoard />}>
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
