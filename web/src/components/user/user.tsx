import React from "react";
import { Button, Container } from "react-bootstrap";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";

import { setAccessToken } from "../../auth";
import { Error, Loading } from "..";

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
		await client!.resetStore();
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
		<Container className="bodyContainer">
			<h1>User</h1>
			<p className="lead">{`Current user: ${data.currentUser.nickname}`}</p>
			<Button onClick={() => logout()}>Log Out</Button>
		</Container>
	);
};
