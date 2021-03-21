import React from "react";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
	title: string;
	titleRight?: JSX.Element | JSX.Element[] | string;
	children?: JSX.Element | JSX.Element[] | string;
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
