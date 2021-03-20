import React from "react";
import { Modal, Nav, Tab } from "react-bootstrap";

import { CreateTab } from "./createTab";
import { SearchTab } from "./searchTab";
import { RecordModel, RecordType } from "../../../models/build";

interface Props {
	type: RecordType;
	show: boolean;
	onSelect: (record?: RecordModel) => void;
	createOnly?: boolean;
	searchOnly?: boolean;
}

export const RecordSelectModal = ({ createOnly, searchOnly, onSelect, show, type }: Props) => (
	<Modal show={show} backdrop="static" size="lg">
		<Tab.Container defaultActiveKey={createOnly ? "createTab" : "searchTab"}>
			<Modal.Header closeButton onHide={onSelect}>
				<Modal.Title>{`${createOnly ? "Create" : "Select"} ${type}`}</Modal.Title>
			</Modal.Header>

			{createOnly ? (
				<Tab.Content>
					<CreateTab type={type} onSelect={onSelect} />
				</Tab.Content>
			) : searchOnly ? (
				<Tab.Content>
					<SearchTab type={type} onSelect={onSelect} />
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
						<SearchTab type={type} onSelect={onSelect} />
						<CreateTab type={type} onSelect={onSelect} />
					</Tab.Content>
				</>
			)}
		</Tab.Container>
	</Modal>
);
