import { useQuery } from "@apollo/client";
import Modal from "react-bootstrap/Modal";

import { QueryResult } from "../../../objects/shared";
import { CategoryObject, RecordType } from "../../../objects/build";
import { Error, Loading } from "../../shared";
import { EditCategory } from "./editCategory";
import { CATEGORY_BY_ID } from "./category";

const EditCategoryModal = ({ categoryId, onSubmit }: { categoryId: string; onSubmit: () => void }) => {
	const { data, error, loading } = useQuery<{ recordById: QueryResult<CategoryObject> }, { id: string; type: RecordType }>(CATEGORY_BY_ID, {
		fetchPolicy: "network-only",
		variables: {
			id: categoryId,
			type: RecordType.Category
		}
	});

	return loading ? (
		<Loading />
	) : error || !data ? (
		<Error message={error?.message} />
	) : !data.recordById.result ? (
		<Error message={"Category not found"} />
	) : (
		<EditCategory category={data.recordById.result} onSubmit={onSubmit} />
	);
};

export const EditCategoryControl = ({ categoryId, onSubmit }: { categoryId?: string; onSubmit: (edited: boolean) => void }) => {
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
