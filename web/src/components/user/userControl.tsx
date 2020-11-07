import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

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

export const UserControl = () => {
	const { data, error, loading } = useQuery<Data, {}>(CURRENT_USER, { fetchPolicy: "network-only" });

	if (error || loading) {
		return null;
	} else if (data?.currentUser) {
		return (
			<Nav.Link as={NavLink} to="/user">
				{data!.currentUser.nickname}
			</Nav.Link>
		);
	} else {
		return (
			<>
				<Nav.Link as={NavLink} to="/login">
					Login
				</Nav.Link>
				<Nav.Link as={NavLink} to="/register">
					Register
				</Nav.Link>
			</>
		);
	}
};
