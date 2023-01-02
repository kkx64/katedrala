import "./App.scss";

import React, { useEffect } from "react";

import axios from "axios";
import { RootState, useAppDispatch, useAppSelector } from "./redux/store";

import { Outlet } from "react-router-dom";
import { getId, getPieces, refreshMyUid } from "./redux/slices/mainSlice";

function App() {
	const dispatch = useAppDispatch();

	const { loading } = useAppSelector((state: RootState) => state.main);

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
			<div
				className={`fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-80
			${loading && "opacity-100 pointer-events-auto"}
			${!loading && "opacity-0 pointer-events-none"}
			flex items-center justify-center`}
			>
				<h2 className="text-4xl font-extrabold">LOADING</h2>
			</div>
		</div>
	);
}

export default App;

