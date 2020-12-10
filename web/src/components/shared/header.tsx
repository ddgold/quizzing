import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

import { useUserStatus, UserStatus } from "../user";

export const Header = () => {
	const [userStatus, nickname] = useUserStatus();

	return (
		<>
			<Navbar bg="primary" variant="dark" expand="md" style={{ marginBottom: "20px" }}>
				<Navbar.Brand as={Link} to="/">
					Quizzing
				</Navbar.Brand>
				<Navbar.Collapse id="basic-navbar-nav">
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
				</Navbar.Collapse>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
			</Navbar>
		</>
	);
};
