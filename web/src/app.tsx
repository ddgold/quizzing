import { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route, RouteProps } from "react-router-dom";

import { setAccessToken } from "./auth";
import { ErrorPage, Home, Header, LoadingPage } from "./components/shared";
import { BoardList, Board } from "./components/build/board";
import { CategoryList, Category } from "./components/build/category";
import { Game, Play } from "./components/play";
import { CurrentUserProvider, Login, Register, useCurrentUser, User } from "./components/user";

export const serverURL = (protocol: "http" | "ws", path: "graphql" | "refreshToken"): string => {
	return `${protocol}://${process.env.REACT_APP_SERVER_URI}/${path}`;
};

const LoggedInRoute = (routeProps: RouteProps) => {
	const currentUser = useCurrentUser();
	return <Route {...routeProps}>{!currentUser ? <ErrorPage message="Not logged in" /> : <>{routeProps.children}</>}</Route>;
};

const LoggedOutRoute = (routeProps: RouteProps) => {
	const currentUser = useCurrentUser();
	return <Route {...routeProps}>{currentUser ? <ErrorPage message="You are already logged in" /> : <>{routeProps.children}</>}</Route>;
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

	return loading ? (
		<>
			<Header loading />
			<LoadingPage />
		</>
	) : (
		<Router>
			<CurrentUserProvider>
				<Header />

				<Switch>
					<Route exact path="/">
						<Home />
					</Route>

					<LoggedInRoute exact path="/play">
						<Play />
					</LoggedInRoute>
					<LoggedInRoute exact path="/play/:gameId">
						<Game />
					</LoggedInRoute>

					<LoggedInRoute exact path="/build/boards/all">
						<BoardList showAll={true} />
					</LoggedInRoute>
					<LoggedInRoute exact path="/build/boards/my">
						<BoardList showAll={false} />
					</LoggedInRoute>
					<LoggedInRoute exact path="/build/boards/:id">
						<Board />
					</LoggedInRoute>
					<LoggedInRoute exact path="/build/categories/all">
						<CategoryList showAll={true} />
					</LoggedInRoute>
					<LoggedInRoute exact path="/build/categories/my">
						<CategoryList showAll={false} />
					</LoggedInRoute>
					<LoggedInRoute exact path="/build/categories/:id">
						<Category />
					</LoggedInRoute>

					<LoggedInRoute exact path="/user">
						<User />
					</LoggedInRoute>
					<LoggedOutRoute exact path="/login">
						<Login />
					</LoggedOutRoute>
					<LoggedOutRoute exact path="/register">
						<Register />
					</LoggedOutRoute>

					<Route>
						<ErrorPage message="Page not found" />
					</Route>
				</Switch>
			</CurrentUserProvider>
		</Router>
	);
};
