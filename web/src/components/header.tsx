import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

import { useUserStatus, UserStatus } from ".";

export const Header = () => {
	const [userStatus, nickname] = useUserStatus();

	return (
		<>
			<Navbar bg="primary" variant="dark" style={{ marginBottom: "20px" }}>
				<Navbar.Brand as={Link} to="/">
					Quizzing
				</Navbar.Brand>
				<Nav className="mr-auto">
					{userStatus === UserStatus.LoggedIn ? (
						<>
							<Nav.Link as={NavLink} to="/boards/all">
								All Boards
							</Nav.Link>
							<Nav.Link as={NavLink} to="/boards/my">
								My Boards
							</Nav.Link>
							<Nav.Link as={NavLink} to="/categories/all">
								All Categories
							</Nav.Link>
							<Nav.Link as={NavLink} to="/categories/my">
								My Categories
							</Nav.Link>
						</>
					) : null}
				</Nav>
				<Nav className="justify-content-end">
					{userStatus === UserStatus.LoggedIn ? (
						<Nav.Link as={NavLink} to="/user">
							{nickname}
						</Nav.Link>
					) : null}
					{userStatus === UserStatus.LoggedOut ? (
						<>
							<Nav.Link as={NavLink} to="/login">
								Login
							</Nav.Link>
							<Nav.Link as={NavLink} to="/register">
								Register
							</Nav.Link>
						</>
					) : null}
				</Nav>
			</Navbar>
		</>
	);
};
