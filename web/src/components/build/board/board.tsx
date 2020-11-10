import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../..";
import { BoardModel } from "../../../models/build";

const BOARD_BY_ID = gql`
	query BoardById($id: String!) {
		boardById(id: $id) {
			id
			name
			created
		}
	}
`;

interface Data {
	boardById: BoardModel;
}

interface PathVariables {
	id: string;
}

interface Props extends RouteComponentProps {}

const BoardWithoutRouter = (props: Props) => {
	const { data, error, loading } = useQuery<Data, PathVariables>(BOARD_BY_ID, {
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

	return <Page title={data!.boardById.name}></Page>;
};

export const Board = withRouter(BoardWithoutRouter);
