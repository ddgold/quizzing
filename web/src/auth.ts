let accessToken = "";

export const setAccessToken = (newToken: string) => {
	accessToken = newToken;
};

export const getAccessToken = () => {
	return accessToken;
};

export const isLoggedIn = () => {
	return accessToken !== "";
};
