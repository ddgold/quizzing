import React from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { CreateNewCategory, Error, Loading } from "..";
import { CategoryModel } from "../../models/build";

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
		<Container className="bodyContainer">
			<Row>
				<Col>
					<h1>{showAll ? "All Categories" : "My Categories"}</h1>
				</Col>
				<Col style={{ paddingTop: "8px" }} xs="auto">
					<CreateNewCategory />
				</Col>
			</Row>

			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Name</th>
						<th>Created</th>
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
								<td>{`${created.toLocaleString()} by ${category.creator.nickname}`}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		</Container>
	);
};
