import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { setAccessToken } from "./auth";
import { Error, Home, Header, Loading } from "./components/shared";
import { BoardList, Board, CategoryList, Category } from "./components/build";
import { Game, Play } from "./components/play";
import { Login, Register, User } from "./components/user";

export const serverURL = (protocol: "http" | "ws", path: "graphql" | "refreshToken"): string => {
	return `${protocol}://${process.env.REACT_APP_SERVER_URI}/${path}`;
};

export const App = () => {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(serverURL("http", "refreshToken"), { method: "POST", credentials: "include" }).then(async (result) => {
			const { accessToken } = await result.json();
			setAccessToken(accessToken);
			setLoading(false);
		});
	}, []);

	if (loading) {
		return <Loading />;
	}
	return (
		<Router>
			<Header />

			<Switch>
				<Route exact path="/">
					<Home />
				</Route>

				<Route exact path="/play">
					<Play />
				</Route>
				<Route exact path="/play/:id">
					<Game />
				</Route>

				<Route exact path="/build/boards/all">
					<BoardList showAll={true} />
				</Route>
				<Route exact path="/build/boards/my">
					<BoardList showAll={false} />
				</Route>
				<Route exact path="/build/boards/:id">
					<Board />
				</Route>
				<Route exact path="/build/categories/all">
					<CategoryList showAll={true} />
				</Route>
				<Route exact path="/build/categories/my">
					<CategoryList showAll={false} />
				</Route>
				<Route exact path="/build/categories/:id">
					<Category />
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

				<Route>
					<Error message="404: Page not found" />
				</Route>
			</Switch>
		</Router>
	);
};
