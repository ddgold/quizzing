import React, { ReactNode, useState } from "react";
import { Modal, Nav, Tab } from "react-bootstrap";

import { CreateTab } from "./createTab";
import { SearchTab } from "./searchTab";
import { Record, RecordType } from "../../../models/build";

interface Props {
	children: ReactNode;
	createOnly?: boolean;
	onSelect: (record: Record) => void;
	recordType: RecordType;
}

export const RecordSelect = ({ children, createOnly, onSelect, recordType }: Props) => {
	const [showModal, setShowModal] = useState(false);

	const onCancel = () => {
		setShowModal(false);
	};

	const onTabSelect = (record: Record) => {
		setShowModal(false);
		onSelect(record);
	};

	return (
		<>
			<Modal show={showModal} backdrop="static" size="lg">
				<Tab.Container defaultActiveKey={createOnly ? "createTab" : "searchTab"}>
					<Modal.Header closeButton onHide={onCancel}>
						<Modal.Title>{`${createOnly ? "Create" : "Select"} ${recordType}`}</Modal.Title>
					</Modal.Header>

					{createOnly ? (
						<Tab.Content>
							<CreateTab recordType={recordType} onSelect={onTabSelect} />
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
								<SearchTab recordType={recordType} onSelect={onTabSelect} />
								<CreateTab recordType={recordType} onSelect={onTabSelect} />
							</Tab.Content>
						</>
					)}
				</Tab.Container>
			</Modal>

			<div onClick={() => setShowModal(true)}>{children}</div>
		</>
	);
};
