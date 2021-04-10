import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

import { ErrorPage, LoadingPage, Page } from "../../shared";
import { RecordSelectModal } from "../recordSelect";
import { CategoryModel, RecordModel, RecordType } from "../../../models/build";

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
	const { data, error, loading } = useQuery<{ categories: CategoryModel[] }, { showAll: boolean }>(CATEGORIES, {
		fetchPolicy: "network-only",
		variables: { showAll }
	});

	const onSelect = (record?: RecordModel) => {
		setSelectingCategory(false);
		if (record) {
			const category = record as CategoryModel;
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
					{data.categories.map((category: CategoryModel, index: number) => {
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
