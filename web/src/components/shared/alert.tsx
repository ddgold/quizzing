import React, { useState } from "react";
import { Alert as BSAlert, Container } from "react-bootstrap";

interface Props {
	variant: "success" | "warning" | "error";
	show: boolean;
	onDismiss: () => void;
	autoClose: number;
	header?: JSX.Element | JSX.Element[] | string;
	children: JSX.Element | JSX.Element[] | string;
}

export const Alert = ({ variant, show, onDismiss, autoClose, header, children }: Props) => {
	const [dismissing, setDismissing] = useState(false);
	const defaultHeader = () => {
		switch (variant) {
			case "success": {
				return "Success!";
			}
			case "warning": {
				return "Warning";
			}
			case "error": {
				return "Error";
			}
		}
	};

	const bsVariant = () => {
		switch (variant) {
			case "error": {
				return "danger";
			}
			default: {
				return variant;
			}
		}
	};

	if (autoClose && show && !dismissing) {
		setTimeout(() => {
			onDismiss();
			setDismissing(false);
		}, autoClose);
		setDismissing(true);
	}

	return (
		<Container>
			<BSAlert
				variant={bsVariant()}
				style={{ marginLeft: -15, marginRight: -15 }}
				show={show}
				onClose={onDismiss}
				dismissible
			>
				<BSAlert.Heading>{header || defaultHeader()}</BSAlert.Heading>
				{children}
			</BSAlert>
		</Container>
	);
};
