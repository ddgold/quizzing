import { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { ErrorPage, LoadingPage, Page } from "../../shared";
import { EditBoard } from "./editBoard";
import { ViewBoard } from "./viewBoard";
import { QueryError } from "../../../objects/shared";
import { BoardObject, RecordType } from "../../../objects/build";

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

export const Board = withRouter((props: RouteComponentProps) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<{ recordById: QueryError<BoardObject> }, { id: string; type: RecordType }>(RECORD_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as { id: string }).id,
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
		} else if (data?.recordById.canEdit) {
			return (
				<Button variant="primary" onClick={() => setEditing(true)}>
					Edit
				</Button>
			);
		} else {
			return undefined;
		}
	};

	return loading ? (
		<LoadingPage />
	) : error || !data ? (
		<ErrorPage message={error?.message} />
	) : !data.recordById.result ? (
		<ErrorPage message={"Board not found"} />
	) : (
		<Page title={data.recordById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditBoard board={data.recordById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewBoard board={data.recordById.result} />
			)}
		</Page>
	);
});
