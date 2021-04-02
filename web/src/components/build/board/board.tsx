import { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../../shared";
import { EditBoard } from "./editBoard";
import { ViewBoard } from "./viewBoard";
import { QueryError } from "../../../models/shared";
import { BoardModel, RecordType } from "../../../models/build";

const RECORD_BY_ID = gql`
	query RecordById($type: RecordType!, $id: String!) {
		recordById(type: $type, id: $id) {
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
	recordById: QueryError<BoardModel>;
}

interface Variables {
	id: string;
	type: RecordType;
}

interface Props extends RouteComponentProps {}

const BoardWithoutRouter = (props: Props) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<Data, Variables>(RECORD_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as Variables).id,
			type: RecordType.Board
		}
	});

	const editButton = () => {
		if (editing) {
			return (
				<Button variant="outline-primary" onClick={() => setEditing(false)}>
					Cancel
				</Button>
			);
		} else if (data!.recordById.canEdit) {
			return (
				<Button variant="primary" onClick={() => setEditing(true)}>
					Edit
				</Button>
			);
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

	if (!data?.recordById.result) {
		return <Error message={"Board not found"} />;
	}

	return (
		<Page title={data!.recordById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditBoard board={data!.recordById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewBoard board={data!.recordById.result} />
			)}
		</Page>
	);
};

export const Board = withRouter(BoardWithoutRouter);
