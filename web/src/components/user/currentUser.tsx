import { gql, useQuery } from "@apollo/client";
import { createContext, useContext } from "react";

import { UserModel } from "../../models/user";
import { Children, Header, ErrorPage, LoadingPage } from "../shared";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			nickname
			access
		}
	}
`;

const CurrentUserContext = createContext<UserModel | null>(null);

export const CurrentUserProvider = ({ children }: { children?: Children }) => {
	const { data, error, loading } = useQuery<{ currentUser: UserModel | null }, {}>(CURRENT_USER, {
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

export const useCurrentUser = (): UserModel | null => {
	return useContext(CurrentUserContext);
};
