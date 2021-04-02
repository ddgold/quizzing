import { Button } from "react-bootstrap";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

import { setAccessToken } from "../../auth";
import { Error, Loading, Page } from "../shared";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			nickname
		}
	}
`;

const LOGOUT = gql`
	mutation Logout {
		logout
	}
`;

interface Data {
	currentUser: {
		nickname: string;
	};
}

export const User = () => {
	const { data, error, loading } = useQuery<Data, {}>(CURRENT_USER, { fetchPolicy: "network-only" });
	const [logoutMutation, { client }] = useMutation<{}, {}>(LOGOUT);
	const history = useHistory();

	const logout = async () => {
		await logoutMutation();
		setAccessToken("");

		history.push("/");
		await client!.cache.reset();
	};

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	if (!data?.currentUser) {
		return <Error message="Not logged in" />;
	}

	return (
		<Page title="User" titleRight={<Button onClick={() => logout()}>Log Out</Button>}>
			<p className="lead">{`Current user: ${data.currentUser.nickname}`}</p>
		</Page>
	);
};
