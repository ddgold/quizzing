import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { Error, Home, Header, Login, Register } from "./components";

function App() {
	return (
		<Router>
			<Header />

			<Switch>
				<Route exact path="/">
					<Home />
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
}

export default App;
