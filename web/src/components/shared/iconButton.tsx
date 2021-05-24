import Button from "react-bootstrap/Button";

import { Children } from "../shared";

export const IconButton = ({ onClick, children }: { onClick: () => void; children: Children }) => {
	return (
		<Button variant="outline-primary" className="iconButton" onClick={() => onClick()}>
			{children}
		</Button>
	);
};
