import { useState } from "react";
import { Button, Col, Form, Modal, Row, Tab, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useQuery } from "@apollo/client";

import { SearchResult } from "../../../models/shared";
import { getRecordTypeName, RecordModel, RecordType } from "../../../models/build";
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

const RECENT_RECORDS = gql`
	query RecentRecords($type: RecordType!) {
		recentRecords(type: $type) {
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
`;

interface Data {
	recordSearch: SearchResult<RecordModel>;
	recentRecords: RecordModel[];
}

interface Variables {
	name?: string;
	type: RecordType;
}

interface ResultProps {
	name?: string;
	onSelect: (record: RecordModel) => void;
	type: RecordType;
}

const SearchResults = ({ name, onSelect, type }: ResultProps) => {
	const { data, error, loading } = useQuery<Data, Variables>(name ? RECORD_SEARCH : RECENT_RECORDS, {
		fetchPolicy: "network-only",
		variables: { name: name, type: type }
	});

	if (error) {
		return <Error message={error.message} modelError />;
	}

	if (loading) {
		return <Loading />;
	}

	const result = name ? data!.recordSearch.result : data!.recentRecords;

	const title = (
		<p>{name ? `Results for '${name}':` : `Recent ${getRecordTypeName(type, { plural: true, lowerCase: true })}:`}</p>
	);

	if (result.length === 0) {
		return (
			<>
				{title}
				<p style={{ fontStyle: "italic" }}>None</p>
			</>
		);
	}

	return (
		<>
			{title}
			<Table striped bordered hover>
				<thead>
					<tr>
						<th style={{ width: "50%" }}>Name</th>
						<th style={{ width: "50%" }}>Created</th>
					</tr>
				</thead>
				<tbody>
					{result.map((record: RecordModel, index: number) => {
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
		</>
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
			setError("name", {
				type: "manual",
				message: `Error creating new ${getRecordTypeName(type, { lowerCase: true })}`
			});
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="searchTab">
			<Form noValidate onSubmit={onSubmit}>
				<Modal.Body>
					<Form.Group controlId="name">
						<Form.Label>{`${getRecordTypeName(type)} name`}</Form.Label>
						<Row>
							<Col>
								<Form.Control
									name="name"
									type="name"
									ref={register({
										required: {
											value: true,
											message: `${getRecordTypeName(type)} name is required`
										},
										maxLength: {
											value: 32,
											message: `${getRecordTypeName(type)} name must be at most 32 characters`
										}
									})}
									placeholder={`Enter ${getRecordTypeName(type, { lowerCase: true })} name`}
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
				<Modal.Body style={{ paddingTop: 0 }}>
					<SearchResults name={searchName} onSelect={onSelect} type={type} />
				</Modal.Body>
			</Form>
		</Tab.Pane>
	);
};
