import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../../shared";
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

interface Data {
	recordById: QueryError<CategoryModel>;
}

interface Variables {
	id: string;
	type: RecordType;
}

interface Props extends RouteComponentProps {}

const CategoryWithoutRouter = (props: Props) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<Data, Variables>(CATEGORY_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: (props.match.params as Variables).id,
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
		return <Error message={"Category not found"} />;
	}

	return (
		<Page title={data!.recordById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditCategory category={data!.recordById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewCategory category={data!.recordById.result} />
			)}
		</Page>
	);
};

export const Category = withRouter(CategoryWithoutRouter);
