import React, { useEffect, useState } from "react";
import Navbar from "react-bootstrap/esm/Navbar";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { setAccessToken } from "./auth";
import { BoardList, Board, Error, Home, Header, Login, Register, Loading, User } from "./components";

export const App = () => {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:8000/refreshToken", { method: "POST", credentials: "include" }).then(async (result) => {
			const { accessToken } = await result.json();
			setAccessToken(accessToken);
			setLoading(false);
		});
	}, []);

	if (loading) {
		return (
			<Router>
				<Navbar bg="primary" variant="dark" style={{ marginBottom: "20px" }}>
					<Navbar.Brand>Quizzing</Navbar.Brand>
				</Navbar>
				<Loading />
			</Router>
		);
	}
	return (
		<Router>
			<Header />

			<Switch>
				<Route exact path="/">
					<Home />
				</Route>
				<Route exact path="/user">
					<User />
				</Route>
				<Route exact path="/login">
					<Login />
				</Route>
				<Route exact path="/register">
					<Register />
				</Route>
				<Route exact path="/boards/all">
					<BoardList showAll={true} />
				</Route>
				<Route exact path="/boards/my">
					<BoardList showAll={false} />
				</Route>
				<Route exact path="/boards/id/:id">
					<Board />
				</Route>
				<Route>
					<Error message="404: Page not found" />
				</Route>
			</Switch>
		</Router>
	);
};
