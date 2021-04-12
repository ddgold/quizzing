import { gql, useQuery } from "@apollo/client";
import { createContext, useContext } from "react";

import { UserObject } from "../../objects/user";
import { Children, Header, ErrorPage, LoadingPage } from "../shared";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			id
			nickname
			access
		}
	}
`;

const CurrentUserContext = createContext<UserObject | null>(null);

export const CurrentUserProvider = ({ children }: { children?: Children }) => {
	const { data, error, loading } = useQuery<{ currentUser: UserObject | null }, {}>(CURRENT_USER, {
		fetchPolicy: "network-only"
	});

	return loading ? (
		<>
			<Header loading />
			<LoadingPage />
		</>
	) : error || !data ? (
		<>
			<Header loading />
			<ErrorPage message={error?.message} />
		</>
	) : (
		<CurrentUserContext.Provider value={data?.currentUser}>{children}</CurrentUserContext.Provider>
	);
};

export const useCurrentUser = (): UserObject | null => {
	return useContext(CurrentUserContext);
};
