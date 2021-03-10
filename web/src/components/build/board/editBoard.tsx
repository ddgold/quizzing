import React from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../models/shared";
import { BoardModel, CategoryModel, RecordModel, RecordType } from "../../../models/build";
import { RecordSelect } from "../recordSelect";
import { EditCategoryControl } from "../category";

const UPDATE_BOARD = gql`
	mutation UpdateBoard($id: String!, $name: String!, $description: String!, $categoryIds: [String!]!) {
		updateBoard(id: $id, name: $name, description: $description, categoryIds: $categoryIds) {
			result {
				... on Board {
					id
					name
					description
					categories {
						id
						name
						description
					}
					creator {
						id
						nickname
					}
					created
					updated
				}
			}
			errors {
				message
				field
			}
		}
	}
`;

interface Props {
	board: BoardModel;
	onSubmit: (update: BoardModel) => void;
}

type Fields = "name" | "description" | "categories";

interface Data {
	updateBoard: FormResult<BoardModel, Fields>;
}

interface State {
	id: string;
	name: string;
	description: string;
	categories: CategoryModel[];
	categoryIds: string[];
}

export const EditBoard = (props: Props) => {
	const { control, errors, handleSubmit, register, setError } = useForm<State>({
		defaultValues: props.board
	});
	const { append, fields, remove } = useFieldArray<CategoryModel>({ control, name: "categories" });
	const [updateBoardMutation] = useMutation<Data, State>(UPDATE_BOARD);

	const onSubmit = handleSubmit(async (state: State) => {
		try {
			state.categoryIds = fields.map((category) => {
				return category.id!;
			});

			const variables = {
				...state,
				id: props.board.id
			};

			const result = await updateBoardMutation({
				variables: variables
			});

			if (result.data!.updateBoard.errors) {
				result.data!.updateBoard.errors.forEach((error: FieldError<Fields>) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else {
				props.onSubmit(result.data!.updateBoard.result!);
			}
		} catch (error) {
			setError("name", { type: "manual", message: "Error updating board" });
		}
	});

	const onSelect = (record: RecordModel) => {
		append(record as CategoryModel);
	};

	return (
		<Form noValidate onSubmit={onSubmit}>
			<Form.Group controlId="name">
				<Form.Label>Name</Form.Label>
				<Form.Control
					name="name"
					ref={register({
						required: {
							value: true,
							message: "Name is required"
						},
						maxLength: {
							value: 32,
							message: "Name must be at most 32 characters"
						}
					})}
					placeholder="Enter name"
					isInvalid={!!errors.name}
				/>
				<Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
			</Form.Group>

			<Form.Group controlId="description">
				<Form.Label>Description</Form.Label>
				<Form.Control
					name="description"
					as="textarea"
					style={{ resize: "none" }}
					rows={2}
					ref={register({
						maxLength: {
							value: 265,
							message: "Description must be at most 265 characters"
						}
					})}
					placeholder="Enter description"
					isInvalid={!!errors.description}
				/>
				<Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
			</Form.Group>

			<Form.Group>
				<h3>Categories</h3>
				{fields.length > 0 ? (
					fields.map((category, index) => {
						return (
							<InputGroup key={index} style={{ marginBottom: "0.5rem" }}>
								<Form.Control as="div" style={{ height: "100%" }}>
									<p className="lead">{category.name}</p>
									{category.description}
								</Form.Control>

								<InputGroup.Append>
									<EditCategoryControl categoryId={category.id!}>
										<Button variant="outline-secondary">Edit</Button>
									</EditCategoryControl>
									<Button variant="outline-secondary" onClick={() => remove(index)}>
										Remove
									</Button>
								</InputGroup.Append>
							</InputGroup>
						);
					})
				) : (
					<p>No Categories</p>
				)}
			</Form.Group>
			<Row style={{ paddingTop: "1rem" }}>
				<Col>
					<RecordSelect type={RecordType.Category} onSelect={onSelect}>
						<Button variant="outline-secondary">Add Category</Button>
					</RecordSelect>
				</Col>
				<Col style={{ textAlign: "right" }}>
					<Button variant="primary" type="submit">
						Submit
					</Button>
				</Col>
			</Row>
		</Form>
	);
};
