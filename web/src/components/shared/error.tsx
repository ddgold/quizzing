import { Page } from ".";

interface Props {
	message: string;
	modelError?: boolean;
}

export const Error = ({ message, modelError }: Props) => {
	if (modelError) {
		return (
			<p>
				Oops! Something went wrong...
				<br />
				{message}
			</p>
		);
	} else {
		return (
			<Page title="Error">
				<p className="lead" style={{ marginBottom: "0px" }}>
					{message}
				</p>
			</Page>
		);
	}
};
