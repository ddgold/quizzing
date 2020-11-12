import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { CreateCategory, Error, Loading, Page } from "../..";
import { CategoryModel } from "../../../models/build";

const CATEGORIES = gql`
	query Categories($showAll: Boolean!) {
		categories(showAll: $showAll) {
			id
			name
			created
			creator {
				nickname
			}
		}
	}
`;

interface Data {
	categories: CategoryModel[];
}

interface Props {
	showAll: boolean;
}

export const CategoryList = ({ showAll }: Props) => {
	const { data, error, loading } = useQuery<Data, Props>(CATEGORIES, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Page title={showAll ? "All Categories" : "My Categories"} titleRight={<CreateCategory />}>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th style={{ width: "50%" }}>Name</th>
						<th style={{ width: "50%" }}>Created</th>
					</tr>
				</thead>
				<tbody>
					{data!.categories.map((category: CategoryModel, index: number) => {
						const created = new Date(category.created);
						return (
							<tr key={index}>
								<td>
									<Link to={"/categories/id/" + category.id}>{category.name}</Link>
								</td>
								<td>
									{showAll ? `${created.toLocaleString()} by ${category.creator.nickname}` : created.toLocaleString()}
								</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Page>
	);
};
