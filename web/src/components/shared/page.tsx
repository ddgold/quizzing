import { Col, Container, Row } from "react-bootstrap";

import { Children } from "../shared";

interface Props {
	title?: string;
	titleRight?: Children;
	children?: Children;
}

export const Page = ({ title, titleRight, children }: Props) => {
	return (
		<Container className="bodyContainer">
			<Row>
				<Col>
					<h1>{title}</h1>
				</Col>
				<Col style={{ paddingTop: "8px" }} xs="auto">
					{titleRight}
				</Col>
			</Row>
			{children}
		</Container>
	);
};
