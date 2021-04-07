import { useEffect, useState } from "react";
import { Spinner, Row } from "react-bootstrap";

export const Loading = () => {
	const [showSpinner, setShowSpinner] = useState(false);

	useEffect(() => {
		setTimeout(() => {
			setShowSpinner(true);
		}, 100);
	}, [setShowSpinner]);

	if (showSpinner) {
		return (
			<Row className="justify-content-center" style={{ margin: "1rem" }}>
				<Spinner animation="border" variant="primary" />
			</Row>
		);
	} else {
		return null;
	}
};
