import { Page } from "../shared";

export const Error = ({ message }: { message?: string }) => (
	<p className="lead" style={{ marginBottom: "0px" }}>
		{message || "Something went wrong"}
	</p>
);

export const ErrorPage = ({ title, message }: { title?: string; message?: string }) => (
	<Page title={title || "Oops!"}>
		<Error message={message} />
	</Page>
);
