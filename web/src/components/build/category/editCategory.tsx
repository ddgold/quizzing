import { Button, Col, Form, FormCheck, InputGroup, Row } from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

import { FieldError, FormResult } from "../../../objects/shared";
import { CategoryObject, ClueObject } from "../../../objects/build";

const UPDATE_CATEGORY = gql`
	mutation UpdateCategory($id: String!, $name: String!, $description: String!, $format: CategoryFormat!, $clues: [ClueInput!]!) {
		updateCategory(id: $id, name: $name, description: $description, format: $format, clues: $clues) {
			result {
				... on Category {
					id
					name
					description
					format
					clues {
						answer
						question
					}
					creator {
						id
						nickname
					}
					created
				}
			}
			errors {
				message
				field
			}
		}
	}
`;

type Fields = "name" | "description" | "clues";

interface State {
	id: string;
	name: string;
	description: string;
	clues: ClueObject[];
}

export const EditCategory = ({ category, onSubmit }: { category: CategoryObject; onSubmit: (update: CategoryObject) => void }) => {
	const { control, errors, handleSubmit, register, setError } = useForm<CategoryObject>({
		defaultValues: category
	});
	const { fields, append, remove } = useFieldArray<ClueObject>({ control, name: "clues" });
	const [updateCategoryMutation] = useMutation<{ updateCategory: FormResult<CategoryObject, Fields> }, State>(UPDATE_CATEGORY);

	const onSubmitInternal = handleSubmit(async (state: CategoryObject) => {
		try {
			if (!state.clues) {
				state.clues = [];
			}

			const result = await updateCategoryMutation({
				variables: {
					...state,
					id: category.id
				}
			});

			if (!result.data) {
				throw new Error("No data");
			}

			if (result.data.updateCategory.errors) {
				result.data.updateCategory.errors.forEach((error: FieldError<Fields>) => {
					setError(error.field, { type: "manual", message: error.message });
				});
			} else if (result.data.updateCategory.result) {
				onSubmit(result.data.updateCategory.result);
			}
		} catch (error) {
			setError("name", { type: "manual", message: "Error updating category" });
		}
	});

	return (
		<Form noValidate onSubmit={onSubmitInternal}>
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

			<Form.Group controlId="format">
				<Form.Label>Format</Form.Label>
				<Form.Check>
					<FormCheck.Input type="radio" name="format" value="FIXED" ref={register} />
					<FormCheck.Label>Fixed</FormCheck.Label>
				</Form.Check>
				<Form.Check>
					<FormCheck.Input type="radio" name="format" value="RANDOM" ref={register} />
					<FormCheck.Label>Random</FormCheck.Label>
				</Form.Check>
				<Form.Check>
					<FormCheck.Input type="radio" name="format" value="SORTED" ref={register} />
					<FormCheck.Label>Sorted</FormCheck.Label>
				</Form.Check>
				<Form.Control.Feedback type="invalid">{errors.format?.message}</Form.Control.Feedback>
			</Form.Group>

			<Form.Group>
				<h3>Clues</h3>
			</Form.Group>
			{fields.length > 0 ? (
				fields.map((clue, index) => {
					let answerError = "";
					let questionError = "";
					let errorString = "";
					if (errors.clues && errors.clues[index]) {
						if (errors.clues[index]!.answer) {
							answerError = errors.clues[index]!.answer!.message ?? "";
						}
						if (errors.clues[index]!.question) {
							questionError = errors.clues[index]!.question!.message ?? "";
						}

						if (answerError && questionError) {
							errorString = `${answerError},  ${questionError}`;
						} else if (answerError) {
							errorString = answerError;
						} else {
							errorString = questionError;
						}
					}

					return (
						<InputGroup key={clue.id} style={{ marginBottom: "0.5rem" }}>
							<Form.Control
								name={`clues[${index}].answer`}
								id={`clues[${index}].answer`}
								as="textarea"
								style={{ resize: "none" }}
								rows={3}
								ref={register({
									required: {
										value: true,
										message: "Answer is required"
									},
									maxLength: {
										value: 128,
										message: "Answer must be at most 128 characters"
									}
								})}
								defaultValue={clue.answer}
								placeholder="Enter answer"
								isInvalid={!!answerError}
							/>

							<Form.Control
								name={`clues[${index}].question`}
								id={`clues[${index}].question`}
								as="textarea"
								style={{ resize: "none" }}
								rows={3}
								ref={register({
									required: {
										value: true,
										message: "Question is required"
									},
									maxLength: {
										value: 64,
										message: "Question must be at most 64 characters"
									}
								})}
								defaultValue={clue.question}
								placeholder="Enter question"
								isInvalid={!!questionError}
							/>

							<InputGroup.Append>
								<Button
									variant="outline-secondary"
									size="sm"
									style={{ borderTopRightRadius: "0.2rem", borderBottomRightRadius: "0.2rem" }}
									onClick={() => remove(index)}
								>
									-
								</Button>
							</InputGroup.Append>

							<Form.Control.Feedback type="invalid">{errorString}</Form.Control.Feedback>
						</InputGroup>
					);
				})
			) : (
				<Form.Control plaintext disabled type="text" placeholder="No clues" />
			)}
			<Row style={{ paddingTop: "1rem" }}>
				<Col>
					<Button variant="outline-secondary" onClick={() => append({})}>
						Add Clue
					</Button>
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
