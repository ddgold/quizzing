import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import { BoardModel, RecordModel, RecordType } from "../../models/build";
import { RecordSelectModal } from "../build/recordSelect";
import { Alert, Page } from "../shared";

const HOST_GAME = gql`
	mutation HostGame($boardId: String!) {
		hostGame(boardId: $boardId)
	}
`;

export const HostGame = () => {
	const [creatingGame, setCreatingGame] = useState(false);
	const [gameCreationError, setGameCreationError] = useState<string | undefined>(undefined);
	const [hostMutation] = useMutation<{ hostGame: string }, { boardId: string }>(HOST_GAME);
	const history = useHistory();

	const onSelect = async (record?: RecordModel) => {
		setCreatingGame(false);
		if (record) {
			try {
				const board = record as BoardModel;
				const result = await hostMutation({ variables: { boardId: board.id } });
				history.push(`/play/${result.data?.hostGame}`);
			} catch (error) {
				setGameCreationError(error.message);
			}
		}
	};

	return (
		<>
			<Alert variant={"error"} show={!!gameCreationError} onDismiss={() => setGameCreationError(undefined)} autoClose={5000}>
				{gameCreationError!}
			</Alert>

			<Page title="Host Game" titleRight={<Button onClick={() => setCreatingGame(true)}>Host Game</Button>}>
				<RecordSelectModal type={RecordType.Board} show={creatingGame} onSelect={onSelect} searchOnly />
			</Page>
		</>
	);
};
