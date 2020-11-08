import React from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { CreateNewBoard, Error, Loading } from "..";
import { BoardModel } from "../../models/board";

const ALL_BOARDS = gql`
	query AllBoards {
		allBoards {
			id
			name
			created
		}
	}
`;

interface Data {
	allBoards: BoardModel[];
}

export const BoardList = () => {
	const { data, error, loading } = useQuery<Data>(ALL_BOARDS, { fetchPolicy: "network-only" });

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
					<h1>Board List</h1>
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
					{data!.allBoards.map((board: BoardModel, index: number) => {
						const created = new Date(board.created);
						return (
							<tr key={index}>
								<td>
									<Link to={"./boards/" + board.id}>{board.name}</Link>
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
