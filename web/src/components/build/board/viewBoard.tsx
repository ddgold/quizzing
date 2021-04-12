import { Table } from "react-bootstrap";

import { BoardObject, CategoryObject } from "../../../objects/build";

export const ViewBoard = ({ board }: { board: BoardObject }) => {
	return (
		<>
			<p>{board.description}</p>
			{board.categories.length > 0 ? (
				<Table striped bordered>
					<thead>
						<tr>
							<th>Categories</th>
						</tr>
					</thead>
					<tbody>
						{board.categories.map((category: CategoryObject, index: number) => {
							return (
								<tr key={index}>
									<td>
										<p className="lead">{category.name}</p>
										{category.description}
									</td>
								</tr>
							);
						})}
					</tbody>
				</Table>
			) : (
				<p>No Categories</p>
			)}
			<p>{`Create ${new Date(board.created).toLocaleString()} by ${board.creator.nickname}`}</p>
			<p>{`Last Updated ${new Date(board.updated).toLocaleString()}`}</p>
		</>
	);
};
