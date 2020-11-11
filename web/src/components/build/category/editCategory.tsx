import React from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";

import { CategoryModel, ClueModel } from "../../../models/build";

interface Props {
	category: CategoryModel;
	onSubmit: () => void;
}

export const EditCategory = (props: Props) => {
	const { control, errors, handleSubmit, register } = useForm<CategoryModel>({
		defaultValues: props.category
	});
	const { fields, append, remove } = useFieldArray<ClueModel>({
		control,
		name: "clues"
	});

	const onSubmit = handleSubmit(async (state: CategoryModel) => {
		let result = {
			...props.category,
			...state
		};

		console.log(result);
		props.onSubmit();
	});

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
				<h3>Clues</h3>
			</Form.Group>
			{fields.map((item, index) => {
				let answerError = "";
				let questionError = "";
				let errorString = "";
				if (errors.clues && errors.clues[index]) {
					if (errors.clues![index]!.answer) {
						answerError = errors.clues![index]!.answer!.message ?? "";
					}
					if (errors.clues![index]!.question) {
						questionError = errors.clues![index]!.question!.message ?? "";
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
					<InputGroup key={item.id} style={{ marginBottom: "0.5rem" }}>
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
							defaultValue={item.answer}
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
							defaultValue={item.question}
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
			})}
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
