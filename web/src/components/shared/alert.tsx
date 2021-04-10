import { useState } from "react";
import { Alert as BSAlert, Container } from "react-bootstrap";

import { Children } from "../shared";

interface Props {
	variant: "success" | "warning" | "error";
	show: boolean;
	onDismiss?: () => void;
	autoClose?: number;
	header?: Children;
	children: Children;
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

	if (autoClose && show && !dismissing && onDismiss) {
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
				dismissible={onDismiss !== undefined}
			>
				<BSAlert.Heading>{header || defaultHeader()}</BSAlert.Heading>
				{children}
			</BSAlert>
		</Container>
	);
};
