import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

export const Header = () => (
	<Navbar bg="primary" variant="dark" style={{ marginBottom: "20px" }}>
		<Navbar.Brand as={Link} to="/">
			Quizzing
		</Navbar.Brand>
		<Nav className="mr-auto">
			<Nav.Link as={NavLink} to="/login">
				Login
			</Nav.Link>
			<Nav.Link as={NavLink} to="/register">
				Register
			</Nav.Link>
		</Nav>
	</Navbar>
);
