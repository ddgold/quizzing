import { gql, useQuery } from "@apollo/client";
import { createContext, useContext } from "react";

import { UserModel } from "../../models/user";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			nickname
			access
		}
	}
`;

export enum UserStatus {
	Error,
	Loading,
	LoggedIn,
	LoggedOut
}

type ContextUserPayload = [UserStatus, UserModel | null | undefined, string?];

const CurrentUserContext = createContext<ContextUserPayload>([
	UserStatus.Error,
	undefined,
	"Current user never loaded"
]);

export const CurrentUserProvider = ({ children }: { children: JSX.Element | JSX.Element[] | string | null }) => {
	const { data, error, loading } = useQuery<{ currentUser: UserModel | null }, {}>(CURRENT_USER, {
		fetchPolicy: "network-only"
	});

	const currentStatus = () => {
		if (error?.message === "Not Authorized") {
			return UserStatus.LoggedOut;
		} else if (error) {
			return UserStatus.Error;
		} else if (loading) {
			return UserStatus.Loading;
		} else if (data?.currentUser) {
			return UserStatus.LoggedIn;
		} else {
			return UserStatus.LoggedOut;
		}
	};
	return (
		<CurrentUserContext.Provider value={[currentStatus(), data?.currentUser, error?.message]}>
			{children}
		</CurrentUserContext.Provider>
	);
};

export const useCurrentStatus = (): ContextUserPayload => {
	return useContext(CurrentUserContext);
};

export const useCurrentUser = (): UserModel | null | undefined => {
	const [, currentUser] = useContext(CurrentUserContext);
	return currentUser;
};
