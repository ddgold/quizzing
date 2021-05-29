// import Modal from "react-bootstrap/Modal";
import { useForm } from "react-hook-form";

import { ResultObject } from "../../../objects/play";
import { Timer } from "./timer";
import { Children } from "../../shared";

export const ResponseForm = ({ onSubmit }: { onSubmit: (response: string) => void }) => {
	const {
		handleSubmit,
		register,
		formState: { errors }
	} = useForm<{ response: string }>();

	return (
		<form onSubmit={handleSubmit(({ response }) => onSubmit(response))}>
			<input
				className="responseInput"
				{...register("response", {
					required: {
						value: true,
						message: `Response is required`
					},
					maxLength: {
						value: 64,
						message: `Response must be at most 64 characters`
					}
				})}
				placeholder={`Enter response`}
			/>
			{errors.response ? <p className="responseError">{errors.response.message}</p> : null}
			<input type="submit" style={{ display: "none" }} />
		</form>
	);
};

export const ProtestForm = ({ results, onSubmit }: { results: ResultObject[]; onSubmit?: (index: number) => void }) => {
	const resultString = (result: ResultObject): string => {
		return `${result.correct ? "Correct" : "Wrong"}: ${result.response}`;
	};

	return (
		<>
			{results.map((result, index) => (
				<h2 key={index}>
					<button
						onClick={() => {
							if (onSubmit) {
								onSubmit(index);
							}
						}}
						disabled={!onSubmit || result.protested}
					>
						{resultString(result)}
					</button>
				</h2>
			))}
		</>
	);
};

export const VoteForm = ({ onSubmit }: { onSubmit: (vote: boolean) => void }) => (
	<h2>
		<button onClick={() => onSubmit(true)}>True</button>
		{"  "}
		<button onClick={() => onSubmit(false)}>False</button>
	</h2>
);

interface Props {
	title: string;
	timeout?: string;
	onClick?: () => void;
	children: Children;
}

export const Lightbox = ({ title, timeout, onClick, children }: Props) => {
	return (
		<>
			<div className="lightbox fade modal-backdrop show"></div>
			<div
				role="dialog"
				aria-modal="true"
				className="lightbox fade modal show"
				tabIndex={-1}
				aria-labelledby="lightbox-title"
				style={{ display: "block" }}
				onClick={() => {
					onClick && onClick();
				}}
			>
				<div className="modal-dialog modal-lg modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-header">
							<div className="modal-title h4" id="lightbox-title">
								{title}
							</div>
						</div>
						<div className="modal-body">{children}</div>
						{timeout && (
							<div className="modal-footer">
								<Timer key={title} timeout={timeout} />
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};
