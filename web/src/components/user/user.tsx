import React from "react";
import { Container } from "react-bootstrap";
import { gql, useQuery } from "@apollo/client";
import { Error, Loading } from "..";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			nickname
		}
	}
`;

interface Data {
	currentUser: {
		nickname: string;
	};
}

export const User = () => {
	const { data, error, loading } = useQuery<Data>(CURRENT_USER, { fetchPolicy: "network-only" });

	if (error) {
		return <Error message={error.message} />;
	}

	if (loading) {
		return <Loading />;
	}

	return (
		<Container className="bodyContainer">
			<h1>User</h1>
			<p className="lead" style={{ marginBottom: "0px" }}>
				{`Current user: ${data?.currentUser ? data.currentUser.nickname : "not logged in"}`}
			</p>
		</Container>
	);
};
