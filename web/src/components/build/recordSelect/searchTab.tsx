import { useState } from "react";
import { Button, Col, Form, Modal, Row, Tab, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useQuery } from "@apollo/client";

import { SearchResult } from "../../../objects/shared";
import { getRecordTypeName, RecordObject, RecordType } from "../../../objects/build";
import { Error, Loading } from "../../shared";

const RECORD_SEARCH = gql`
	query RecordSearch($type: RecordType!, $search: String!) {
		recordSearch(type: $type, search: $search) {
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

const SearchResults = ({ search, onSelect, type }: { search?: string; onSelect: (record: RecordObject) => void; type: RecordType }) => {
	const { data, error, loading } = useQuery<
		{ recordSearch: SearchResult<RecordObject>; recentRecords: RecordObject[] },
		{ search?: string; type: RecordType }
	>(search ? RECORD_SEARCH : RECENT_RECORDS, {
		fetchPolicy: "network-only",
		variables: { search: search, type: type }
	});

	const result = (search ? data?.recordSearch.result : data?.recentRecords) || [];

	return loading ? (
		<Loading />
	) : error || !data ? (
		<Error message={error?.message} />
	) : (
		<>
			<p>{search ? `Results for '${search}':` : `Recent ${getRecordTypeName(type, { plural: true, lowerCase: true })}:`}</p>

			{result.length === 0 ? (
				<p style={{ fontStyle: "italic" }}>None</p>
			) : (
				<Table striped bordered hover>
					<thead>
						<tr>
							<th style={{ width: "50%" }}>Name</th>
							<th style={{ width: "50%" }}>Created</th>
						</tr>
					</thead>
					<tbody>
						{result.map((record: RecordObject, index: number) => {
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
			)}
		</>
	);
};

export const SearchTab = ({ onSelect, type }: { onSelect: (record: RecordObject) => void; type: RecordType }) => {
	const { errors, handleSubmit, register, setError } = useForm<{ name: string }>();
	const [searchName, setSearchName] = useState<string | undefined>();

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSubmit = handleSubmit(({ name }: { name: string }) => {
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
					<SearchResults search={searchName} onSelect={onSelect} type={type} />
				</Modal.Body>
			</Form>
		</Tab.Pane>
	);
};
