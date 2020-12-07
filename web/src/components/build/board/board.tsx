import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { EditBoard, Error, Loading, Page, ViewBoard } from "../..";
import { QueryError } from "../../../models/shared";
import { BoardModel } from "../../../models/build";

const BOARD_BY_ID = gql`
	query BoardById($id: String!) {
		boardById(id: $id) {
			result {
				... on Board {
					id
					name
					description
					categories {
						id
						name
						description
					}
					creator {
						id
						nickname
					}
					created
					updated
				}
			}
			canEdit
		}
	}
`;

interface Data {
	boardById: QueryError<BoardModel>;
}

interface PathVariables {
	id: string;
}

interface Props extends RouteComponentProps {}

const BoardWithoutRouter = (props: Props) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<Data, PathVariables>(BOARD_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as PathVariables).id
		}
	});

	const editButton = () => {
		if (editing) {
			return (
				<Button variant="outline-primary" onClick={() => setEditing(false)}>
					Cancel
				</Button>
			);
		} else if (data!.boardById.canEdit) {
			return <Button onClick={() => setEditing(true)}>Edit</Button>;
		} else {
			return undefined;
		}
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	if (!data?.boardById.result) {
		return <Error message={"Board not found"} />;
	}

	return (
		<Page title={data!.boardById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditBoard board={data!.boardById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewBoard board={data!.boardById.result} />
			)}
		</Page>
	);
};

export const Board = withRouter(BoardWithoutRouter);
