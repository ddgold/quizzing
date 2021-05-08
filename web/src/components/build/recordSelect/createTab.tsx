import { gql, useMutation } from "@apollo/client";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";
import { useForm } from "react-hook-form";

import { FieldError, FormResult } from "../../../objects/shared";
import { getRecordTypeName, RecordObject, RecordType } from "../../../objects/build";

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

export const CreateTab = ({ onSelect, type }: { onSelect: (record: RecordObject) => void; type: RecordType }) => {
	const {
		handleSubmit,
		register,
		setError,
		formState: { errors }
	} = useForm<{ name: string }>();
	const [createMutation] = useMutation<{ createRecord: FormResult<RecordObject, "name"> }, { name: string; type: RecordType }>(
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
									type="name"
									{...register("name", {
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
