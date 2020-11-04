import React from "react";
import { Spinner, Row } from "react-bootstrap";

export const Loading = () => (
	<Row className="justify-content-center">
		<Spinner animation="border" variant="primary" />
	</Row>
);
