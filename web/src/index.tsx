import React from "react";
import ReactDOM from "react-dom";
import {
	ApolloClient,
	ApolloLink,
	ApolloProvider,
	createHttpLink,
	InMemoryCache,
	Operation,
	split
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { TokenRefreshLink } from "apollo-link-token-refresh";
import jwt_decode from "jwt-decode";

import { getAccessToken, setAccessToken } from "./auth";
import { App, serverURL } from "./app";

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
		const accessToken = getAccessToken();

		if (!accessToken) {
			return true;
		}

		try {
			const decoded = jwt_decode(accessToken) as TokenPayload;
			return Date.now() < decoded.exp * 1000;
		} catch {
			return false;
		}
	},
	fetchAccessToken: () => {
		return fetch(serverURL("http", "refreshToken"), {
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
const httpLink = setContext((_, { headers }) => {
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
		uri: serverURL("http", "graphql"),
		credentials: "include"
	})
);

// Websocket link for subscriptions
const wsLink = new (class extends ApolloLink {
	link: WebSocketLink | undefined;

	request(operation: Operation) {
		// Only create WebSocketLink at run time
		if (this.link === undefined) {
			this.link = new WebSocketLink({
				uri: serverURL("ws", "graphql"),
				options: {
					reconnect: true,
					connectionParams: { authorization: getAccessToken() }
				}
			});
		}

		return this.link.request(operation);
	}
})();

// Split traffic between websocket (subscriptions) and http (queries, mutations, refresh token) links
const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === "OperationDefinition" && definition.operation === "subscription";
	},
	wsLink,
	httpLink
);

const client = new ApolloClient({
	credentials: "include",
	// FIXME: 'as any' needed for bug in apollo-link-token-refresh
	link: ApolloLink.from([refreshLink as any, errorLink, splitLink]),
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
