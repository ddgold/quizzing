import { RowObject } from "../../../objects/play";

import "./game.scss";

export const Gameboard = ({
	categories,
	rows,
	onSelection
}: {
	categories: string[];
	rows: RowObject[];
	onSelection: (rowIndex: number, colIndex: number) => void;
}) => {
	return (
		<table className="board">
			<thead>
				<tr>
					{categories.map((category: string, index: number) => (
						<th key={index}>
							<div>{category}</div>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row: RowObject, rowIndex: number) => (
					<tr key={rowIndex}>
						{row.cols.map((selected: boolean, colIndex: number) => {
							if (!selected) {
								return (
									<td key={colIndex} onClick={() => onSelection(rowIndex, colIndex)}>
										{row.value}
									</td>
								);
							} else {
								return <td key={colIndex} />;
							}
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
};
