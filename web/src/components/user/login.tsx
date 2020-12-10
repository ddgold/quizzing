import React from "react";
import { Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

import { AuthResult, FieldError } from "../../models/user";
import { isLoggedIn, setAccessToken } from "../../auth";
import { Error, Page } from "../shared";

const LOGIN = gql`
	mutation Login($email: String!, $password: String!) {
		login(email: $email, password: $password) {
			accessToken
			user {
				id
				nickname
				email
			}
			errors {
				field
				message
			}
		}
	}
`;

type Fields = "email" | "password";

interface Data {
	login: AuthResult<Fields>;
}

interface State {
	email: string;
	password: string;
}

export const Login = () => {
	const { errors, handleSubmit, register, setError, setValue } = useForm<State>();
	const [loginMutation, { client }] = useMutation<Data, State>(LOGIN);
	const history = useHistory();

	const onSubmit = handleSubmit(async (state: State) => {
		const result = await loginMutation({
			variables: state
		});

		if (result.data!.login.errors) {
			result.data!.login.errors.forEach((error: FieldError<Fields>) => {
				setError(error.field, { type: "manual", message: error.message });
				setValue("password", "", { shouldValidate: false });
			});
		} else {
			const accessToken = result.data!.login.accessToken;
			setAccessToken(accessToken);

			await client!.resetStore();
			history.push("/");
		}
	});

	if (isLoggedIn()) {
		return <Error message={"You are already logged in"} />;
	}

	return (
		<Page title="Login">
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
		</Page>
	);
};
