import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";

export const Timer = ({ timeout }: { timeout: string }) => {
	const [end, length]: number[] = timeout.split("^").map((string) => Number.parseInt(string));
	const [timeLeft, setTimeLeft] = useState(end! - Date.now());

	useEffect(() => {
		const timer = setTimeout(() => {
			setTimeLeft(timeLeft - 100);
		}, 100);

		return () => clearTimeout(timer);
	});

	return (
		<Row className="timer">
			<Col>
				<ProgressBar animated now={100 - (timeLeft / length!) * 100} />
			</Col>
			<Col className="h4" xs="2" lg="1">
				{timeLeft <= 0 ? "0.0" : `${(timeLeft / 1000).toFixed(timeLeft >= 9950 ? 0 : 1)}`}
			</Col>
		</Row>
	);
};
