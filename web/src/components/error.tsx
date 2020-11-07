import React from "react";
import { Container } from "react-bootstrap";

interface Props {
	message: string;
}

export const Error = ({ message }: Props) => (
	<Container className="bodyContainer">
		<h3>Oop! Something went wrong...</h3>
		<p className="lead" style={{ marginBottom: "0px" }}>
			{message}
		</p>
	</Container>
);
