import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { EditCategory, Error, Loading, Page, ViewCategory } from "../..";
import { CategoryModel } from "../../../models/build";

const CATEGORY_BY_ID = gql`
	query CategoryById($id: String!) {
		categoryById(id: $id) {
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
		}
	}
`;

interface Data {
	categoryById: CategoryModel;
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
		} else {
			return <Button onClick={() => setEditing(true)}>Edit</Button>;
		}
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page title={data!.categoryById.name} titleRight={editButton()}>
			{editing ? (
				<EditCategory category={data!.categoryById} onSubmit={() => setEditing(false)} />
			) : (
				<ViewCategory category={data!.categoryById} />
			)}
		</Page>
	);
};

export const Category = withRouter(CategoryWithoutRouter);
