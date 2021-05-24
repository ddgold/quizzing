import { CurrentGames } from "./currentGames";
import { HostGame } from "./hostGame";
import { JoinGame } from "./joinGame";

export const Play = () => {
	return (
		<>
			<HostGame />
			<CurrentGames />
			<JoinGame />
		</>
	);
};
