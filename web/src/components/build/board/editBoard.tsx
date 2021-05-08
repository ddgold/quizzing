import { useState } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../objects/shared";
import { BoardObject, CategoryObject, RecordObject, RecordType } from "../../../objects/build";
import { RecordSelectModal } from "../recordSelect";
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

type Fields = "name" | "description" | "categories";

interface State {
	id: string;
	name: string;
	description: string;
	categories: CategoryObject[];
	categoryIds: string[];
}

export const EditBoard = (props: { board: BoardObject; onSubmit: (update: BoardObject) => void }) => {
	const {
		control,
		handleSubmit,
		register,
		setError,
		formState: { errors }
	} = useForm<State>({
		defaultValues: props.board
	});
	const { append, fields, remove } = useFieldArray<State>({
		control,
		name: "categories",
		keyName: "key" as "id"
	});
	const [updateBoardMutation] = useMutation<{ updateBoard: FormResult<BoardObject, Fields> }, State>(UPDATE_BOARD);
	const [editingCategory, setEditingCategory] = useState<string | undefined>(undefined);
	const [selectingCategory, setSelectingCategory] = useState(false);

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

			if (!result.data) {
				throw new Error("No data");
			}

			if (result.data.updateBoard.errors) {
				result.data.updateBoard.errors.forEach((error: FieldError<Fields>) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else if (result.data.updateBoard.result) {
				props.onSubmit(result.data.updateBoard.result);
			}
		} catch (error) {
			setError("name", { type: "manual", message: "Error updating board" });
		}
	});

	const onSelect = (record?: RecordObject) => {
		setSelectingCategory(false);
		if (record) {
			append(record as CategoryObject);
		}
	};

	return (
		<>
			<Form noValidate onSubmit={onSubmit}>
				<Form.Group controlId="name">
					<Form.Label>Name</Form.Label>
					<Form.Control
						{...register("name", {
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
						as="textarea"
						style={{ resize: "none" }}
						rows={2}
						{...register("description", {
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
										<Button variant="outline-secondary" onClick={() => setEditingCategory(category.id!)}>
											Edit
										</Button>
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
						<Button variant="outline-secondary" onClick={() => setSelectingCategory(true)}>
							Add Category
						</Button>
					</Col>
					<Col style={{ textAlign: "right" }}>
						<Button variant="primary" type="submit">
							Submit
						</Button>
					</Col>
				</Row>
			</Form>

			<RecordSelectModal type={RecordType.Category} show={selectingCategory} onSelect={onSelect} />
			<EditCategoryControl categoryId={editingCategory} onSubmit={() => setEditingCategory(undefined)} />
		</>
	);
};
