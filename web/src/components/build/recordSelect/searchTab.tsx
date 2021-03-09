import React, { useState } from "react";
import { Button, Col, Form, Modal, Row, Tab, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useQuery } from "@apollo/client";

import { SearchResult } from "../../../models/shared";
import { CategoryModel, Record, RecordType } from "../../../models/build";
import { Error, Loading } from "../../shared";

const CATEGORY_SEARCH = gql`
	query CategorySearch($name: String!) {
		categorySearch(name: $name) {
			result {
				... on Category {
					id
					name
					created
					description
					creator {
						nickname
					}
				}
			}
		}
	}
`;

interface Data {
	categorySearch: SearchResult<CategoryModel>;
}

interface State {
	name: string;
}

interface ResultProps {
	name: string;
	onSelect: (record: Record) => void;
}

const SearchResults = ({ name, onSelect }: ResultProps) => {
	const { data, error, loading } = useQuery<Data, State>(CATEGORY_SEARCH, {
		variables: { name }
	});

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Table striped bordered hover>
			<thead>
				<tr>
					<th style={{ width: "50%" }}>Name</th>
					<th style={{ width: "50%" }}>Created</th>
				</tr>
			</thead>
			<tbody>
				{data!.categorySearch.result.map((category: CategoryModel, index: number) => {
					console.log(category);
					const created = new Date(category.created);
					return (
						<tr key={index}>
							<td>
								<Button
									onClick={() => {
										onSelect(category);
									}}
								>
									{category.name}
								</Button>
							</td>
							<td>{`${created.toLocaleString()} by ${category.creator.nickname}`}</td>
						</tr>
					);
				})}
			</tbody>
		</Table>
	);
};

interface TabProps {
	onSelect: (record: Record) => void;
	recordType: RecordType;
}

export const SearchTab = ({ onSelect, recordType }: TabProps) => {
	const { errors, handleSubmit, register, setError } = useForm<State>();
	const [searchName, setSearchName] = useState<string | undefined>();

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSearch = handleSubmit(async (state: State) => {
		try {
			state.name = sanitizeName(state.name);
			setSearchName(state.name);
		} catch (error) {
			setError("name", { type: "manual", message: `Error creating new ${recordType.toLocaleLowerCase()}` });
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="searchTab">
			<Form noValidate>
				<Modal.Body>
					<Form.Group controlId="name">
						<Form.Label>{`${recordType} name`}</Form.Label>
						<Row>
							<Col>
								<Form.Control
									name="name"
									type="name"
									ref={register({
										required: {
											value: true,
											message: `${recordType} name is required`
										},
										maxLength: {
											value: 32,
											message: `${recordType} name must be at most 32 characters`
										}
									})}
									placeholder={`Enter ${recordType.toLocaleLowerCase()} name`}
									isInvalid={!!errors.name}
								/>
								<Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
							</Col>
							<Col xs="auto">
								<Button variant="primary" onClick={onSearch}>
									Search
								</Button>
							</Col>
						</Row>
					</Form.Group>
				</Modal.Body>
				{searchName ? (
					<Modal.Body style={{ paddingTop: 0 }}>
						<SearchResults name={searchName} onSelect={onSelect} />
					</Modal.Body>
				) : null}
			</Form>
		</Tab.Pane>
	);
};
