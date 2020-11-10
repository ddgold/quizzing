import React from "react";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
	title: string;
	titleRight?: JSX.Element;
	children?: JSX.Element;
}

export const Page = (props: Props) => {
	return (
		<Container className="bodyContainer">
			<Row>
				<Col>
					<h1>{props.title}</h1>
				</Col>
				<Col style={{ paddingTop: "8px" }} xs="auto">
					{props.titleRight}
				</Col>
			</Row>
			{props.children}
		</Container>
	);
};
