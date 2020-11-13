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
			{category.clues.length > 0 ? (
				<Table striped bordered>
					<thead>
						<tr>
							<th style={{ width: "65%" }}>Answer</th>
							<th style={{ width: "35%" }}>Question</th>
						</tr>
					</thead>
					<tbody>
						{category.clues.map((clue: ClueModel, index: number) => {
							return (
								<tr key={index}>
									<td>{clue.answer}</td>
									<td>{clue.question}</td>
								</tr>
							);
						})}
					</tbody>
				</Table>
			) : (
				<p>No clues</p>
			)}
			<p>{`Create ${new Date(category.created).toLocaleString()} by ${category.creator.nickname}`}</p>
			<p>{`Last Updated ${new Date(category.updated).toLocaleString()}`}</p>
		</>
	);
};
