import React from "react";
import { Container, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading } from "..";

const ALL_BOARDS = gql`
	query AllBoards {
		allBoards {
			id
			name
			created
		}
	}
`;

interface Board {
	id: string;
	name: string;
	created: Date;
}

interface Data {
	allBoards: Board[];
}

export const BoardList = () => {
	const { data, error, loading } = useQuery<Data, {}>(ALL_BOARDS, { fetchPolicy: "network-only" });

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Container className="bodyContainer">
			<h1>Board List</h1>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Name</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{data!.allBoards.map((board: Board, index: number) => {
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
