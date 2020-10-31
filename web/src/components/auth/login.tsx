import React from "react";
import { Container, Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

const LOGIN = gql`
	mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password)
	}
`;

interface FormState {
	email: string;
	password: string;
}

export const Login = () => {
	const { errors, handleSubmit, register } = useForm<FormState>();
	const [loginMutation] = useMutation(LOGIN);

	const onSubmit = handleSubmit(async (state: FormState) => {
		await loginMutation({
			variables: state
		});
	});

	return (
		<Container className="bodyContainer">
			<h1>Login</h1>
			<Form noValidate onSubmit={onSubmit}>
				<Form.Group controlId="email">
					<Form.Label>Email address</Form.Label>
					<Form.Control
						name="email"
						type="email"
						ref={register({
							required: {
								value: true,
								message: "An email address is required"
							},
							pattern: {
								value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
								message: "Enter a valid e-mail address"
							}
						})}
						placeholder="Enter email"
						isInvalid={!!errors.email}
					/>
					<Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
				</Form.Group>

				<Form.Group controlId="password">
					<Form.Label>Password</Form.Label>
					<Form.Control
						name="password"
						type="password"
						ref={register({
							required: {
								value: true,
								message: "Your password is required"
							}
						})}
						placeholder="Password"
						isInvalid={!!errors.password}
					/>
					<Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
				</Form.Group>

				<Button variant="primary" type="submit">
					Login
				</Button>
			</Form>
		</Container>
	);
};
