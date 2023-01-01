import "../styles/game.scss";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

const SetUsernamePage = () => {
	const navigate = useNavigate();

	const [username, setUsername] = useState("");

	const confirmUsername = () => {
		localStorage.setItem("username", username);
		navigate("/");
	};

	return (
		<div className="w-full h-[86vh] flex flex-col items-stretch lg:items-center px-10 lg:px-[30vw] justify-center gap-4">
			<div>Set Username</div>
			<input
				className="w-full px-4 py-4 rounded-xl bg-gray-800"
				onChange={(e) => setUsername(e.target.value)}
				type="text"
				placeholder="Username"
			/>
			<button className="w-full px-8 py-4 bg-yellow-500 rounded-xl mt-8" onClick={confirmUsername} type="button">
				Confirm
			</button>
		</div>
	);
};

export default SetUsernamePage;

