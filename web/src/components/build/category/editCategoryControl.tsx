import { gql, useQuery } from "@apollo/client";
import React, { ReactNode, useState } from "react";
import { Modal } from "react-bootstrap";

import { QueryError } from "../../../models/shared";
import { CategoryModel } from "../../../models/build";
import { Error, Loading } from "../../shared";
import { EditCategory } from "./editCategory";

const CATEGORY_BY_ID = gql`
	query CategoryById($id: String!) {
		categoryById(id: $id) {
			result {
				... on Category {
					id
					name
					description
					clues {
						answer
						question
					}
					creator {
						id
						nickname
					}
					created
					updated
				}
			}
			canEdit
		}
	}
`;

interface Data {
	categoryById: QueryError<CategoryModel>;
}

interface PathVariables {
	id: string;
}

interface ModalProps {
	categoryId: string;
	onSubmit: () => void;
}

const EditCategoryModal = ({ categoryId, onSubmit }: ModalProps) => {
	const { data, error, loading } = useQuery<Data, PathVariables>(CATEGORY_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: categoryId
		}
	});

	if (error) {
		return <Error message={error.message} modelError />;
	}

	if (loading) {
		return <Loading />;
	}

	return <EditCategory category={data!.categoryById.result} onSubmit={onSubmit} />;
};

interface ControlProps {
	categoryId: string;
	children: ReactNode;
}

export const EditCategoryControl = ({ categoryId, children }: ControlProps) => {
	const [showModal, setShowModal] = useState(false);

	const onCancel = () => {
		setShowModal(false);
	};

	return (
		<>
			<Modal show={showModal} backdrop="static" size="lg">
				<Modal.Header closeButton onHide={onCancel}>
					<Modal.Title>Edit Category</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<EditCategoryModal categoryId={categoryId} onSubmit={() => setShowModal(false)} />
				</Modal.Body>
			</Modal>

			<div onClick={() => setShowModal(true)}>{children}</div>
		</>
	);
};
