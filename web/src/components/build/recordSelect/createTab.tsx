import React from "react";
import { Button, Col, Form, Modal, Row, Tab } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../models/shared";
import { CategoryModel, Record, RecordType } from "../../../models/build";

const CREATE_CATEGORY = gql`
	mutation CreateCategory($name: String!) {
		createCategory(name: $name) {
			result {
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
	createCategory: FormResult<CategoryModel, Fields>;
}

interface State {
	name: string;
}

interface Props {
	onSelect: (record: Record) => void;
	recordType: RecordType;
}

export const CreateTab = ({ onSelect, recordType }: Props) => {
	const { errors, handleSubmit, register, setError } = useForm<State>();
	const [createMutation] = useMutation<Data, State>(CREATE_CATEGORY);

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSubmit = handleSubmit(async (state: State) => {
		try {
			state.name = sanitizeName(state.name);

			const result = await createMutation({
				variables: state
			});

			if (result.data!.createCategory.errors) {
				result.data!.createCategory.errors.forEach((error: FieldError<Fields>) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else {
				onSelect(result.data!.createCategory.result);
			}
		} catch (error) {
			setError("name", { type: "manual", message: `Error creating new ${recordType.toLocaleLowerCase()}` });
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="createTab">
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
