import { gql, useQuery } from "@apollo/client";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { Link, useHistory } from "react-router-dom";

import { ErrorPage, LoadingPage, Page } from "../../shared";
import { RecordSelectModal } from "../recordSelect";
import { CategoryObject, RecordObject, RecordType } from "../../../objects/build";

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

export const CategoryList = ({ showAll }: { showAll: boolean }) => {
	const [selectingCategory, setSelectingCategory] = useState(false);
	const history = useHistory();
	const { data, error, loading } = useQuery<{ categories: CategoryObject[] }, { showAll: boolean }>(CATEGORIES, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	const onSelect = (record?: RecordObject) => {
		setSelectingCategory(false);
		if (record) {
			const category = record as CategoryObject;
			history.push(`/build/categories/${category.id}`);
		}
	};

	const title = showAll ? "All Categories" : "My Categories";

	return loading ? (
		<LoadingPage title={title} />
	) : error || !data ? (
		<ErrorPage message={error?.message} />
	) : (
		<Page
			title={title}
			titleRight={
				<Button variant="primary" onClick={() => setSelectingCategory(true)}>
					Create New
				</Button>
			}
		>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th style={{ width: "50%" }}>Name</th>
						<th style={{ width: "50%" }}>Created</th>
					</tr>
				</thead>
				<tbody>
					{data.categories.map((category: CategoryObject, index: number) => {
						const created = new Date(category.created);
						return (
							<tr key={index}>
								<td>
									<Link to={`/build/categories/${category.id}`}>{category.name}</Link>
								</td>
								<td>{showAll ? `${created.toLocaleString()} by ${category.creator.nickname}` : created.toLocaleString()}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>

			<RecordSelectModal type={RecordType.Category} show={selectingCategory} onSelect={onSelect} createOnly />
		</Page>
	);
};
