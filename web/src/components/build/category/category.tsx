import React from "react";
import { Table } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { Error, Loading, Page } from "../..";
import { CategoryModel, ClueModel } from "../../../models/build";

const CATEGORY_BY_ID = gql`
	query CategoryById($id: String!) {
		categoryById(id: $id) {
			name
			clues {
				answer
				question
			}
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
	const { data, error, loading } = useQuery<Data, PathVariables>(CATEGORY_BY_ID, {
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
		<Page title={data!.categoryById.name}>
			<Table striped bordered>
				<thead>
					<tr>
						<th>Answer</th>
						<th>Question</th>
					</tr>
				</thead>
				<tbody>
					{data!.categoryById.clues.map((clue: ClueModel, index: number) => {
						return (
							<tr key={index}>
								<td>{clue.answer}</td>
								<td>{clue.question}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Page>
	);
};

export const Category = withRouter(CategoryWithoutRouter);
