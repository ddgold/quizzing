import React, { useState } from "react";
import { Button, Col, Form, Modal, Row, Tab, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useQuery } from "@apollo/client";

import { SearchResult } from "../../../models/shared";
import { RecordModel, RecordType } from "../../../models/build";
import { Error, Loading } from "../../shared";

const RECORD_SEARCH = gql`
	query RecordSearch($type: RecordType!, $name: String!) {
		recordSearch(type: $type, name: $name) {
			result {
				... on Board {
					id
					name
					created
					description
					creator {
						nickname
					}
				}
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
	recordSearch: SearchResult<RecordModel>;
}

interface Variables {
	name: string;
	type: RecordType;
}

interface ResultProps {
	name: string;
	onSelect: (record: RecordModel) => void;
	type: RecordType;
}

const SearchResults = ({ name, onSelect, type }: ResultProps) => {
	const { data, error, loading } = useQuery<Data, Variables>(RECORD_SEARCH, {
		fetchPolicy: "network-only",
		variables: { name: name, type: type }
	});

	if (error) {
		return <Error message={error.message} modelError />;
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
				{data!.recordSearch.result.map((record: RecordModel, index: number) => {
					const created = new Date(record.created);
					return (
						<tr key={index}>
							<td>
								<Button
									onClick={() => {
										onSelect(record);
									}}
								>
									{record.name}
								</Button>
							</td>
							<td>{`${created.toLocaleString()} by ${record.creator.nickname}`}</td>
						</tr>
					);
				})}
			</tbody>
		</Table>
	);
};

interface State {
	name: string;
}

interface TabProps {
	onSelect: (record: RecordModel) => void;
	type: RecordType;
}

export const SearchTab = ({ onSelect, type }: TabProps) => {
	const { errors, handleSubmit, register, setError } = useForm<State>();
	const [searchName, setSearchName] = useState<string | undefined>();

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSubmit = handleSubmit(({ name }: State) => {
		try {
			name = sanitizeName(name);
			setSearchName(name);
		} catch (error) {
			setError("name", { type: "manual", message: `Error creating new ${type.toLocaleLowerCase()}` });
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="searchTab">
			<Form noValidate onSubmit={onSubmit}>
				<Modal.Body>
					<Form.Group controlId="name">
						<Form.Label>{`${type} name`}</Form.Label>
						<Row>
							<Col>
								<Form.Control
									name="name"
									type="name"
									ref={register({
										required: {
											value: true,
											message: `${type} name is required`
										},
										maxLength: {
											value: 32,
											message: `${type} name must be at most 32 characters`
										}
									})}
									placeholder={`Enter ${type.toLocaleLowerCase()} name`}
									isInvalid={!!errors.name}
								/>
								<Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
							</Col>
							<Col xs="auto">
								<Button variant="primary" type="submit">
									Search
								</Button>
							</Col>
						</Row>
					</Form.Group>
				</Modal.Body>
				{searchName ? (
					<Modal.Body style={{ paddingTop: 0 }}>
						<SearchResults name={searchName} onSelect={onSelect} type={type} />
					</Modal.Body>
				) : null}
			</Form>
		</Tab.Pane>
	);
};
