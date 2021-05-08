import { gql, useMutation } from "@apollo/client";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

import { AuthResult, FieldError } from "../../objects/user";
import { setAccessToken } from "../../auth";
import { Page } from "../shared";

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

interface State {
	email: string;
	password: string;
}

export const Login = () => {
	const {
		handleSubmit,
		register,
		setError,
		setValue,
		formState: { errors }
	} = useForm<State>();
	const [loginMutation, { client }] = useMutation<{ login: AuthResult<Fields> }, State>(LOGIN);
	const history = useHistory();

	const onSubmit = handleSubmit(async (state: State) => {
		const result = await loginMutation({
			variables: state
		});

		if (!result.data) {
			throw new Error("No data");
		}

		if (result.data.login.errors) {
			result.data.login.errors.forEach((error: FieldError<Fields>) => {
				setError(error.field, { type: "manual", message: error.message });
				setValue("password", "", { shouldValidate: false });
			});
		} else {
			const accessToken = result.data.login.accessToken;
			setAccessToken(accessToken);

			await client.resetStore();
			history.push("/");
		}
	});

	return (
		<Page title="Login">
			<Form noValidate onSubmit={onSubmit}>
				<Form.Group controlId="email">
					<Form.Label>Email address</Form.Label>
					<Form.Control
						type="email"
						{...register("email", {
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
						type="password"
						{...register("password", {
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
