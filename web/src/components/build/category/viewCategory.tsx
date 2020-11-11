import React from "react";
import { Table } from "react-bootstrap";

import { CategoryModel, ClueModel } from "../../../models/build";

interface Props {
	category: CategoryModel;
}

export const ViewCategory = ({ category }: Props) => {
	return (
		<>
			<p>{category.description}</p>
			<Table striped bordered>
				<thead>
					<tr>
						<th>Answer</th>
						<th>Question</th>
					</tr>
				</thead>
				<tbody>
					{category.clues.map((clue: ClueModel) => {
						return (
							<tr key={clue.id}>
								<td>{clue.answer}</td>
								<td>{clue.question}</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
			<p>{`Create ${new Date(category.created).toLocaleString()} by ${category.creator.nickname}`}</p>
		</>
	);
};
