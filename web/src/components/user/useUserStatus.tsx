import { gql, useQuery } from "@apollo/client";

const CURRENT_USER = gql`
	query CurrentUser {
		currentUser {
			nickname
		}
	}
`;

interface Data {
	currentUser: {
		nickname: string;
	};
}

export enum UserStatus {
	Error,
	Loading,
	LoggedIn,
	LoggedOut
}

export const useUserStatus = (): [UserStatus, String?] => {
	const { data, error, loading } = useQuery<Data, {}>(CURRENT_USER, { fetchPolicy: "network-only" });

	if (error?.message === "Not Authorized") {
		return [UserStatus.LoggedOut];
	} else if (error) {
		return [UserStatus.Error];
	} else if (loading) {
		return [UserStatus.Loading];
	} else if (data?.currentUser) {
		return [UserStatus.LoggedIn, data!.currentUser.nickname];
	} else {
		return [UserStatus.LoggedOut];
	}
};
