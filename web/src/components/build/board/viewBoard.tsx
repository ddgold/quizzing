import React from "react";
import { Table } from "react-bootstrap";

import { BoardModel, CategoryModel } from "../../../models/build";

interface Props {
	board: BoardModel;
}

export const ViewBoard = ({ board }: Props) => {
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
						{board.categories.map((category: CategoryModel, index: number) => {
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
