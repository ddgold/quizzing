import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Link, NavLink, useLocation } from "react-router-dom";

import { useCurrentStatus, UserStatus } from "../user";
import { Alert } from "./alert";

export const Header = () => {
	const [userStatus, currentUser, error] = useCurrentStatus();
	const location = useLocation();

	return (
		<>
			<Navbar bg="primary" variant="dark" expand="sm" style={{ marginBottom: "20px" }}>
				<Navbar.Brand as={Link} to="/">
					Quizzing
				</Navbar.Brand>
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="mr-auto">
						{userStatus === UserStatus.LoggedIn ? (
							<>
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
							</>
						) : null}
					</Nav>
					<Nav className="justify-content-end">
						{userStatus === UserStatus.LoggedIn ? (
							<Nav.Link as={NavLink} to="/user">
								{currentUser!.nickname}
							</Nav.Link>
						) : userStatus === UserStatus.LoggedOut ? (
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
			<Alert variant={"error"} show={userStatus === UserStatus.Error}>
				{error!}
			</Alert>
		</>
	);
};
