import { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { ErrorPage, LoadingPage, Page } from "../../shared";
import { EditCategory } from "./editCategory";
import { ViewCategory } from "./viewCategory";
import { QueryError } from "../../../models/shared";
import { CategoryModel, RecordType } from "../../../models/build";

export const CATEGORY_BY_ID = gql`
	query RecordById($type: RecordType!, $id: String!) {
		recordById(type: $type, id: $id) {
			result {
				... on Category {
					id
					name
					description
					format
					clues {
						answer
						question
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

export const Category = withRouter((props: RouteComponentProps) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<{ recordById: QueryError<CategoryModel> }, { id: string; type: RecordType }>(CATEGORY_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as { id: string }).id,
			type: RecordType.Category
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
		<ErrorPage message={"Category not found"} />
	) : (
		<Page title={data.recordById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditCategory category={data.recordById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewCategory category={data.recordById.result} />
			)}
		</Page>
	);
});
