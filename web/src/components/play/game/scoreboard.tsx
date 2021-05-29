import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useCurrentUser } from "../../user/currentUser";

import { PlayerArray, PlayerObject } from "../../../objects/play";

import "./game.scss";

export const Scoreboard = ({ players, isActive }: { players: PlayerArray; isActive: (player: PlayerObject | null) => boolean }) => {
	const current = useCurrentUser();
	return (
		<Row className="justify-content-center">
			{players.map((player, index) => {
				let className = "player";
				if (isActive(player)) {
					className += " active";
				}
				if (player?.alreadyActed) {
					className += " alreadyActed";
				}
				if (player?.id === current?.id) {
					className += " current";
				}

				return (
					<Col className={className} key={index} xs={3}>
						{player ? (
							<>
								<div className="name">{player.nickname}</div>
								<div className="score">{player.score}</div>
							</>
						) : (
							<div className="name">Open Spot</div>
						)}
					</Col>
				);
			})}
		</Row>
	);
};
