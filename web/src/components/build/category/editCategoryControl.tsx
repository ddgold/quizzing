import { useQuery } from "@apollo/client";
import React, { ReactNode, useState } from "react";
import { Modal } from "react-bootstrap";

import { QueryError } from "../../../models/shared";
import { CategoryModel, RecordType } from "../../../models/build";
import { Error, Loading } from "../../shared";
import { EditCategory } from "./editCategory";
import { CATEGORY_BY_ID } from "./category";

interface Data {
	recordById: QueryError<CategoryModel>;
}

interface Variables {
	id: string;
	type: RecordType;
}

interface ModalProps {
	categoryId: string;
	onSubmit: () => void;
}

const EditCategoryModal = ({ categoryId, onSubmit }: ModalProps) => {
	const { data, error, loading } = useQuery<Data, Variables>(CATEGORY_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: categoryId,
			type: RecordType.Category
		}
	});

	if (error) {
		return <Error message={error.message} modelError />;
	}

	if (loading) {
		return <Loading />;
	}

	return <EditCategory category={data!.recordById.result} onSubmit={onSubmit} />;
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
