import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useCurrentUser } from "../user";

const HeaderLoaded = () => {
	const currentUser = useCurrentUser();
	const location = useLocation();

	return currentUser ? (
		<Navbar.Collapse id="header-navbar">
			<Nav className="mr-auto">
				<Nav.Link as={NavLink} to="/play">
					Play
				</Nav.Link>
				<NavDropdown id="buildDropdown" title="Build" active={location.pathname.split("/")[1] === "build"}>
					<NavDropdown.Item as={NavLink} to="/build/boards/all">
						All Boards
					</NavDropdown.Item>
					<NavDropdown.Item as={NavLink} to="/build/boards/my">
						My Boards
					</NavDropdown.Item>
					<NavDropdown.Divider />
					<NavDropdown.Item as={NavLink} to="/build/categories/all">
						All Categories
					</NavDropdown.Item>
					<NavDropdown.Item as={NavLink} to="/build/categories/my">
						My Categories
					</NavDropdown.Item>
				</NavDropdown>
			</Nav>
			<Nav className="justify-content-end">
				<Nav.Link as={NavLink} to="/user">
					{currentUser.nickname}
				</Nav.Link>
			</Nav>
		</Navbar.Collapse>
	) : (
		<Navbar.Collapse id="header-navbar">
			<Nav className="mr-auto" />
			<Nav className="justify-content-end">
				<Nav.Link as={NavLink} to="/login">
					Login
				</Nav.Link>
				<Nav.Link as={NavLink} to="/register">
					Register
				</Nav.Link>
			</Nav>
		</Navbar.Collapse>
	);
};

export const Header = ({ loading }: { loading?: boolean }) => {
	return (
		<Navbar bg="primary" variant="dark" expand="sm" style={{ marginBottom: "20px" }}>
			<Navbar.Brand as={loading ? Navbar.Brand : Link} to="/">
				Quizzing
			</Navbar.Brand>
			{loading ? undefined : <HeaderLoaded />}
		</Navbar>
	);
};
