import React from "react";
import { Container, Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

import { AuthResult, FieldError } from "../../models/auth";
import { isLoggedIn, setAccessToken } from "../../auth";
import { Error } from "..";

const REGISTER = gql`
	mutation Register($nickname: String!, $email: String!, $password: String!) {
		register(nickname: $nickname, email: $email, password: $password) {
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

type Fields = "nickname" | "email" | "password" | "confirmPassword";

interface Data {
	register: AuthResult<Fields>;
}

interface State {
	nickname: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export const Register = () => {
	const { errors, getValues, handleSubmit, register, setError, setValue } = useForm<State>();
	const [registerMutation] = useMutation<Data, State>(REGISTER);
	const history = useHistory();

	const onSubmit = handleSubmit(async (state: State) => {
		const result = await registerMutation({
			variables: state
		});

		if (result.data!.register.errors) {
			result.data!.register.errors.forEach((error: FieldError<Fields>) => {
				setError(error.field, { type: "manual", message: error.message });
				setValue("password", "", { shouldValidate: false });
				setValue("confirmPassword", "", { shouldValidate: false });
			});
		} else {
			const accessToken = result.data!.register.accessToken;
			setAccessToken(accessToken);

			history.push("/");
		}
	});

	const passwordsMatch = () => {
		const values = getValues(["password", "confirmPassword"]);
		return values.password === values.confirmPassword;
	};

	if (isLoggedIn()) {
		return <Error message={"You are already logged in"} />;
	}

	return (
		<Container className="bodyContainer">
			<h1>Register</h1>
			<Form noValidate onSubmit={onSubmit}>
				<Form.Group controlId="nickname">
					<Form.Label>Nickname</Form.Label>
					<Form.Control
						name="nickname"
						placeholder="Enter nickname"
						ref={register({
							required: {
								value: true,
								message: "Nickname is required"
							},
							pattern: {
								value: /^[A-Za-z0-9_]*$/i,
								message: "Nickname can only include letters, numbers, and underscores (_)"
							}
						})}
						isInvalid={!!errors.nickname}
					/>
					<Form.Control.Feedback type="invalid">{errors.nickname?.message}</Form.Control.Feedback>
				</Form.Group>

				<Form.Group controlId="email">
					<Form.Label>Email address</Form.Label>
					<Form.Control
						name="email"
						type="email"
						placeholder="Enter email"
						ref={register({
							required: {
								value: true,
								message: "Email address is required"
							},
							pattern: {
								value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
								message: "Email address must be a valid"
							}
						})}
						isInvalid={!!errors.email}
					/>
					<Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
				</Form.Group>

				<Form.Group controlId="password">
					<Form.Label>Password</Form.Label>
					<Form.Control
						name="password"
						type="password"
						placeholder="Password"
						ref={register({
							required: {
								value: true,
								message: "Password is required"
							},
							minLength: {
								value: 8,
								message: "Password must be at least 8 characters"
							},
							pattern: {
								value: /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^*-_=+])/,
								message: "Password must include a number, an uppercase, a lowercase, and a symbol (~!@#$%^*-_=+)"
							}
						})}
						isInvalid={!!errors.password}
					/>
					<Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
				</Form.Group>

				<Form.Group controlId="confirmPassword">
					<Form.Label>Confirm Password</Form.Label>
					<Form.Control
						name="confirmPassword"
						type="password"
						placeholder="Password"
						ref={register({
							required: {
								value: true,
								message: "Password must be confirmed"
							},
							validate: (value) => passwordsMatch() || "The passwords must match"
						})}
						isInvalid={!!errors.confirmPassword}
					/>
					<Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
				</Form.Group>

				<Button variant="primary" type="submit">
					Submit
				</Button>
			</Form>
		</Container>
	);
};
