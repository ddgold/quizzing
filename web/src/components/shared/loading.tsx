import { Spinner, Row } from "react-bootstrap";

export const Loading = () => (
	<Row className="justify-content-center" style={{ paddingTop: "8px" }}>
		<Spinner animation="border" variant="primary" />
	</Row>
);
