import "./App.scss";

import React, { useEffect } from "react";

import axios from "axios";
import { useAppDispatch } from "./redux/store";

import { Outlet } from "react-router-dom";
import { getId, getPieces, refreshMyUid } from "./redux/slices/mainSlice";

function App() {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(getPieces());

		if (!localStorage.getItem("uid")) dispatch(getId());
		else dispatch(refreshMyUid());

		axios.interceptors.request.use(
			function (config) {
				if (config.headers) {
					config.headers["UserID"] = localStorage.getItem("uid");
					config.headers["Username"] = localStorage.getItem("username");
				}
				return config;
			},
			function (error) {
				return Promise.reject(error);
			}
		);
	}, [dispatch]);

	return (
		<div className="App bg-gray-900">
			<Outlet />
		</div>
	);
}

export default App;

