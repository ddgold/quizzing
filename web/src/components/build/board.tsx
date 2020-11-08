import React from "react";
import { Container } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading } from "..";
import { BoardModel } from "../../models/board";

const SINGLE_BOARD = gql`
	query SingeBoard($id: String!) {
		singleBoard(id: $id) {
			id
			name
			created
		}
	}
`;

interface Data {
	singleBoard: BoardModel;
}

interface PathVariables {
	id: string;
}

interface Props extends RouteComponentProps {}

const BoardWithoutRouter = (props: Props) => {
	const { data, error, loading } = useQuery<Data>(SINGLE_BOARD, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as PathVariables).id
		}
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Container className="bodyContainer">
			<h1>{data!.singleBoard.name}</h1>
		</Container>
	);
};

export const Board = withRouter(BoardWithoutRouter);
