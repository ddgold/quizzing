import React from "react";
import { Link } from "react-router-dom";

import { Page } from "../shared";

export const Play = () => (
	<Page title="Play">
		<ul>
			<li>
				<Link to="/play/KingKong">KingKong</Link>
			</li>
			<li>
				<Link to="/play/PingPong">PingPong</Link>
			</li>
		</ul>
	</Page>
);
