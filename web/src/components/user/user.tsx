import { Button } from "react-bootstrap";
import { gql, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

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
	const [logoutMutation, { client }] = useMutation<{}, {}>(LOGOUT);
	const history = useHistory();

	const logout = async () => {
		await logoutMutation();
		setAccessToken("");

		history.push("/");
		await client!.cache.reset();
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
