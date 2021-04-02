import { Modal } from "react-bootstrap";
import { useQuery } from "@apollo/client";

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
	categoryId?: string;
	onSubmit: (edited: boolean) => void;
}

export const EditCategoryControl = ({ categoryId, onSubmit }: ControlProps) => {
	if (categoryId === undefined) {
		return null;
	}

	return (
		<Modal show backdrop="static" size="lg">
			<Modal.Header closeButton onHide={() => onSubmit(false)}>
				<Modal.Title>Edit Category</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<EditCategoryModal categoryId={categoryId!} onSubmit={() => onSubmit(true)} />
			</Modal.Body>
		</Modal>
	);
};
