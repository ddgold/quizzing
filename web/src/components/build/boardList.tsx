import React from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { CreateNewBoard, Error, Loading } from "..";
import { BoardModel } from "../../models/board";

const BOARDS = gql`
	query Boards($showAll: Boolean!) {
		boards(showAll: $showAll) {
			id
			name
			created
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
		<Container className="bodyContainer">
			<Row>
				<Col>
					<h1>{showAll ? "All Boards" : "My Boards"}</h1>
				</Col>
				<Col style={{ paddingTop: "8px" }} xs="auto">
					<CreateNewBoard />
				</Col>
			</Row>

			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Name</th>
						<th>Created</th>
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
								<td>{created.toLocaleString()}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Container>
	);
};
