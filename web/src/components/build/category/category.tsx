import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { EditCategory, Error, Loading, Page, ViewCategory } from "../..";
import { QueryError } from "../../../models/shared";
import { CategoryModel } from "../../../models/build";

const CATEGORY_BY_ID = gql`
	query CategoryById($id: String!) {
		categoryById(id: $id) {
			result {
				id
				name
				description
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
			canEdit
		}
	}
`;

interface Data {
	categoryById: QueryError<CategoryModel>;
}

interface PathVariables {
	id: string;
}

interface Props extends RouteComponentProps {}

const CategoryWithoutRouter = (props: Props) => {
	const [editing, setEditing] = useState<boolean>(false);
	const { data, error, loading } = useQuery<Data, PathVariables>(CATEGORY_BY_ID, {
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
		} else if (data!.categoryById.canEdit) {
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

	if (!data?.categoryById.result) {
		return <Error message={"Board not found"} />;
	}

	return (
		<Page title={data!.categoryById.result.name} titleRight={editButton()}>
			{editing ? (
				<EditCategory category={data!.categoryById.result} onSubmit={() => setEditing(false)} />
			) : (
				<ViewCategory category={data!.categoryById.result} />
			)}
		</Page>
	);
};

export const Category = withRouter(CategoryWithoutRouter);
