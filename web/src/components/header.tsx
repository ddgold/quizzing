import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

import { UserControl } from ".";

export const Header = () => {
	return (
		<>
			<Navbar bg="primary" variant="dark" style={{ marginBottom: "20px" }}>
				<Navbar.Brand as={Link} to="/">
					Quizzing
				</Navbar.Brand>
				<Nav className="mr-auto">
					<Nav.Link as={NavLink} to="/boards">
						My Boards
					</Nav.Link>
				</Nav>
				<Nav className="justify-content-end">
					<UserControl />
				</Nav>
			</Navbar>
		</>
	);
};
