import React, { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

import { FieldError, FormResult } from "../../models/shared";
import { CategoryModel } from "../../models/build";

const CREATE_NEW_CATEGORY = gql`
	mutation CreateNewCategory($name: String!) {
		createNewCategory(name: $name) {
			result {
				id
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
	createNewCategory: FormResult<CategoryModel, Fields>;
}

interface State {
	name: string;
}

export const CreateNewCategory = () => {
	const [showModal, setShowModal] = useState<boolean>(false);
	const { errors, handleSubmit, register, setError } = useForm<State>();
	const [createNewCategoryMutation] = useMutation<Data, State>(CREATE_NEW_CATEGORY);
	const history = useHistory();

	const sanitizeName = (name: string): string => {
		return name.trim();
	};

	const onCancel = () => {
		setShowModal(false);
	};

	const onSubmit = handleSubmit(async (state: State) => {
		state.name = sanitizeName(state.name);

		const result = await createNewCategoryMutation({
			variables: state
		});

		if (result.data!.createNewCategory.errors) {
			result.data!.createNewCategory.errors.forEach((error: FieldError<Fields>) => {
				setError(error.field, { type: "manual", message: error.message });
			});
		} else {
			setShowModal(false);

			const newCategoryId = result.data!.createNewCategory.result.id;
			history.push(`/categories/id/${newCategoryId}`);
		}
	});

	return (
		<>
			{/* Modal is causing 'Warning: findDOMNode is deprecated in StrictMode', known issue with react-bootstrap:
			    https://github.com/react-bootstrap/react-bootstrap/issues/5075 */}
			<Modal show={showModal} centered backdrop="static">
				<Form noValidate onSubmit={onSubmit}>
					<Modal.Header closeButton onHide={onCancel}>
						<Modal.Title>Create New Category</Modal.Title>
					</Modal.Header>

					<Modal.Body>
						<Form.Group controlId="name">
							<Form.Label>Category name</Form.Label>
							<Form.Control
								name="name"
								type="name"
								ref={register({
									required: {
										value: true,
										message: "Category name is required"
									},
									maxLength: {
										value: 32,
										message: "Category name must be at most 32 characters"
									},
									pattern: {
										value: /^[A-Za-z0-9 ]*$/,
										message: "Nickname can only include letters, numbers, and spaces"
									}
								})}
								placeholder="Enter category name"
								isInvalid={!!errors.name}
							/>
							<Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="primary" type="submit">
							Create
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>

			<Button onClick={() => setShowModal(true)}> Create New </Button>
		</>
	);
};
