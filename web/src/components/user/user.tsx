import { Button } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";

import { setAccessToken } from "../../auth";
import { Page } from "../shared";
import { useCurrentUser } from "./currentUser";

const LOGOUT = gql`
	mutation Logout {
		logout
	}
`;

export const User = () => {
	const currentUser = useCurrentUser();
	const [logoutMutation] = useMutation<{}, {}>(LOGOUT);

	const logout = async () => {
		await logoutMutation();
		setAccessToken("");

		window.location.pathname = "/";
	};

	return (
		<Page title="User" titleRight={currentUser ? <Button onClick={() => logout()}>Log Out</Button> : undefined}>
			{currentUser ? (
				<p className="lead">
					{`Current user: ${currentUser.nickname}`}
					<br />
					{`Access level: ${currentUser.access === 1 ? "Admin" : "User"}`}
				</p>
			) : undefined}
		</Page>
	);
};
