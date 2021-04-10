import { Button, Col, Form, Modal, Row, Tab } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../models/shared";
import { getRecordTypeName, RecordModel, RecordType } from "../../../models/build";

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

export const CreateTab = ({ onSelect, type }: { onSelect: (record: RecordModel) => void; type: RecordType }) => {
	const { errors, handleSubmit, register, setError } = useForm<{ name: string }>();
	const [createMutation] = useMutation<{ createRecord: FormResult<RecordModel, "name"> }, { name: string; type: RecordType }>(
		CREATE_RECORD
	);

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onSubmit = handleSubmit(async ({ name }: { name: string }) => {
		try {
			name = sanitizeName(name);

			const result = await createMutation({ variables: { name: name, type: type } });

			if (!result.data) {
				throw new Error("No data");
			}

			if (result.data.createRecord.errors) {
				result.data.createRecord.errors.forEach((error: FieldError<"name">) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else if (result.data.createRecord.result) {
				onSelect(result.data.createRecord.result);
			}
		} catch (error) {
			setError("name", {
				type: "manual",
				message: `Error creating new ${getRecordTypeName(type, { lowerCase: true })}`
			});
			console.error(error);
		}
	});

	return (
		<Tab.Pane eventKey="createTab">
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
