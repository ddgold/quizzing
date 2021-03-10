import React, { ReactNode, useState } from "react";
import { Modal, Nav, Tab } from "react-bootstrap";

import { CreateTab } from "./createTab";
import { SearchTab } from "./searchTab";
import { RecordModel, RecordType } from "../../../models/build";

interface Props {
	children: ReactNode;
	createOnly?: boolean;
	onSelect: (record: RecordModel) => void;
	type: RecordType;
}

export const RecordSelect = ({ children, createOnly, onSelect, type }: Props) => {
	const [showModal, setShowModal] = useState(false);

	const onCancel = () => {
		setShowModal(false);
	};

	const onTabSelect = (record: RecordModel) => {
		setShowModal(false);
		onSelect(record);
	};

	return (
		<>
			<Modal show={showModal} backdrop="static" size="lg">
				<Tab.Container defaultActiveKey={createOnly ? "createTab" : "searchTab"}>
					<Modal.Header closeButton onHide={onCancel}>
						<Modal.Title>{`${createOnly ? "Create" : "Select"} ${type}`}</Modal.Title>
					</Modal.Header>

					{createOnly ? (
						<Tab.Content>
							<CreateTab type={type} onSelect={onTabSelect} />
						</Tab.Content>
					) : (
						<>
							<Modal.Body style={{ paddingBottom: 0 }}>
								<Nav variant="pills">
									<Nav.Item>
										<Nav.Link eventKey="searchTab">Add Existing</Nav.Link>
									</Nav.Item>
									<Nav.Item>
										<Nav.Link eventKey="createTab">Create New</Nav.Link>
									</Nav.Item>
								</Nav>
							</Modal.Body>

							<Tab.Content>
								<SearchTab type={type} onSelect={onTabSelect} />
								<CreateTab type={type} onSelect={onTabSelect} />
							</Tab.Content>
						</>
					)}
				</Tab.Container>
			</Modal>

			<div onClick={() => setShowModal(true)}>{children}</div>
		</>
	);
};
