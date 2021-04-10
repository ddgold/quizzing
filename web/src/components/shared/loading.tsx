import { Spinner, Row } from "react-bootstrap";

import { Page } from "../shared";

export const Loading = () => (
	<Row className="justify-content-center" style={{ margin: "1rem" }}>
		<Spinner animation="border" variant="primary" />
	</Row>
);

export const LoadingPage = ({ title }: { title?: string }) => (
	<Page title={title}>
		<Loading />
	</Page>
);
