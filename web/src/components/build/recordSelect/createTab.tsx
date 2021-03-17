import React from "react";
import { Button, Col, Form, Modal, Row, Tab } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../models/shared";
import { RecordModel, RecordType } from "../../../models/build";

const CREATE_RECORD = gql`
	mutation CreateRecord($type: RecordType!, $name: String!) {
		createRecord(type: $type, name: $name) {
			result {
				... on Board {
					id
					name
					description
				}
				... on Category {
					id
					name
					description
				}
			}
			errors {
				message
				field
			}
		}
	}
`;

type Fields = "name";

interface Data {
	createRecord: FormResult<RecordModel, Fields>;
}

interface Variables {
	name: string;
	type: RecordType;
}

interface State {
	name: string;
}

interface Props {
	onSelect: (record: RecordModel) => void;
	type: RecordType;
}

export const CreateTab = ({ onSelect, type }: Props) => {
	const { errors, handleSubmit, register, setError } = useForm<State>();
	const [createMutation] = useMutation<Data, Variables>(CREATE_RECORD);

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSubmit = handleSubmit(async (state: State) => {
		try {
			state.name = sanitizeName(state.name);

			const result = await createMutation({ variables: { name: state.name, type: type } });

			if (result.data!.createRecord.errors) {
				result.data!.createRecord.errors.forEach((error: FieldError<Fields>) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else {
				onSelect(result.data!.createRecord.result);
			}
		} catch (error) {
			setError("name", { type: "manual", message: `Error creating new ${type.toLocaleLowerCase()}` });
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="createTab">
			<Form noValidate>
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
								<Button variant="primary" onClick={onSubmit}>
									Create
								</Button>
							</Col>
						</Row>
					</Form.Group>
				</Modal.Body>
			</Form>
		</Tab.Pane>
	);
};
