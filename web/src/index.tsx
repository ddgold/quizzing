import React from "react";
import ReactDOM from "react-dom";
import { ApolloClient, ApolloLink, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { TokenRefreshLink } from "apollo-link-token-refresh";
import jwt_decode from "jwt-decode";

import { getAccessToken, setAccessToken } from "./auth";
import { App } from "./app";

import "./index.scss";

interface TokenPayload {
	exp: number;
	iat: number;
	userId: string;
}

// Refresh access token if undefined or expired
const refreshLink = new TokenRefreshLink({
	accessTokenField: "accessToken",
	isTokenValidOrUndefined: () => {
		const token = getAccessToken();

		if (!token) {
			return true;
		}

		try {
			const decoded = jwt_decode(token) as TokenPayload;
			return Date.now() < decoded.exp * 1000;
		} catch {
			return false;
		}
	},
	fetchAccessToken: () => {
		return fetch(process.env.REACT_APP_SERVER_URL + "/refreshToken", {
			method: "POST",
			credentials: "include"
		});
	},
	handleFetch: (accessToken) => {
		setAccessToken(accessToken);
	},
	handleError: (error) => {
		console.error("Refresh token error:", error);
	}
});

// Catch and log errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
	if (graphQLErrors) {
		for (let error of graphQLErrors) {
			switch (error.extensions?.code) {
				case "UNAUTHENTICATED": {
					// Unauthenticated errors handled
					break;
				}
				default: {
					console.error("GraphQL error:", error);
				}
			}
		}
	}
	if (networkError) {
		console.error("Network error:", networkError);
	}
});

// Pass access token, if there is one, with all requests
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
}).concat(
	createHttpLink({
		uri: process.env.REACT_APP_SERVER_URL + "/graphql",
		credentials: "include"
	})
);

const client = new ApolloClient({
	credentials: "include",
	link: ApolloLink.from([refreshLink, errorLink, authLink]),
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
