import { Button } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";

import { setAccessToken } from "../../auth";
import { Error, Loading, Page } from "../shared";
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

	if (currentUser === undefined) {
		return <Loading />;
	}

	if (currentUser === null) {
		return <Error message="Not logged in" />;
	}

	return (
		<Page title="User" titleRight={<Button onClick={() => logout()}>Log Out</Button>}>
			<p className="lead">{`Current user: ${currentUser.nickname}`}</p>
			<p className="lead">{`Access level: ${currentUser.access === 1 ? "Admin" : "User"}`}</p>
		</Page>
	);
};
