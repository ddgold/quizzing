import Table from "react-bootstrap/Table";

import { CategoryObject, ClueObject } from "../../../objects/build";

export const ViewCategory = ({ category }: { category: CategoryObject }) => {
	return (
		<>
			<p>{category.description}</p>
			<p>{`Format: ${category.format}`}</p>
			{category.clues.length > 0 ? (
				<Table striped bordered>
					<thead>
						<tr>
							<th style={{ width: "65%" }}>Answer</th>
							<th style={{ width: "35%" }}>Question</th>
						</tr>
					</thead>
					<tbody>
						{category.clues.map((clue: ClueObject, index: number) => {
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
