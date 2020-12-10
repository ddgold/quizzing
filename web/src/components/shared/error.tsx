import React from "react";

import { Page } from ".";

interface Props {
	message: string;
}

export const Error = ({ message }: Props) => (
	<Page title="Error">
		<p className="lead" style={{ marginBottom: "0px" }}>
			{message}
		</p>
	</Page>
);
