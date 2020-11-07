import React from "react";
import ReactDOM from "react-dom";
import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { getAccessToken } from "./auth";
import { App } from "./app";

import "./index.scss";

const httpLink = createHttpLink({
	uri: process.env.REACT_APP_GRAPHQL_URL,
	credentials: "include"
});

const authLink = setContext((_, { headers }) => {
	const accessToken = getAccessToken();
	if (accessToken) {
		return {
			headers: {
				...headers,
				authorization: `Bearer ${accessToken}`
			}
		};
	}
});

const client = new ApolloClient({
	uri: process.env.REACT_APP_GRAPHQL_URL,
	credentials: "include",
	link: authLink.concat(httpLink),
	cache: new InMemoryCache()
});

ReactDOM.render(
	<React.StrictMode>
		<ApolloProvider client={client}>
			<App />
		</ApolloProvider>
	</React.StrictMode>,
	document.getElementById("root")
);
