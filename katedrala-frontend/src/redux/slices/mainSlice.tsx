import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { AppDispatch, RootState } from "../store";
import Game from "../models/Game";
import axios from "axios";

interface MainState {
	currentGame: null | Game;
	pieces: boolean[][][];
	loading: boolean;
	createdGameId: string | null;
	gameStreamSource: null | EventSource;
	myUid: null | string;
}

const initialState: MainState = {
	currentGame: null,
	pieces: [],
	loading: false,
	createdGameId: null,
	gameStreamSource: null,
	myUid: null,
};

// * REDUCERS

export const mainSlice = createSlice({
	name: "main",
	initialState,
	reducers: {
		getGameUpdateReducer: (state, action) => {
			state.currentGame = JSON.parse(JSON.stringify(action.payload));
		},
		getPiecesReducer: (state, action) => {
			state.pieces = action.payload;
		},
		getIdReducer: (state, action) => {
			localStorage.setItem("uid", action.payload);
			state.myUid = action.payload;
		},
		setLoadingReducer: (state, action) => {
			state.loading = action.payload;
		},
		createGameReducer: (state, action) => {
			state.createdGameId = action.payload;
		},
		connectToGameReducer: (state, action) => {
			state.gameStreamSource = action.payload;
		},
		disconnectFromGameReducer: (state, action) => {
			if (state.gameStreamSource) {
				state.gameStreamSource.close();
				state.gameStreamSource = null;
			}
		},
		setMyUidReducer: (state, action) => {
			state.myUid = localStorage.getItem("uid");
		},
	},
});

export const {
	getPiecesReducer,
	getGameUpdateReducer,
	setLoadingReducer,
	createGameReducer,
	connectToGameReducer,
	disconnectFromGameReducer,
	getIdReducer,
	setMyUidReducer,
} = mainSlice.actions;

// * ACTIONS

export const refreshMyUid = () => (dispatch: AppDispatch) => {
	dispatch(setMyUidReducer(null));
};

export const getId = () => (dispatch: AppDispatch) => {
	axios
		.get(`${process.env.REACT_APP_API_URL}/getId`)
		.then((result) => {
			dispatch(getIdReducer(result.data));
		})
		.catch((error) => {
			console.error(error);
		});
};

export const getPieces = () => (dispatch: AppDispatch) => {
	axios
		.get(`${process.env.REACT_APP_API_URL}/getPieces`)
		.then((result) => {
			dispatch(getPiecesReducer(result.data));
		})
		.catch((error) => {
			console.error(error);
		});
};

interface PlacePieceRequest {
	pieceId: number;
	position: [number, number];
	orientation: number;
	gameId: string;
}

export const placePiece = (props: PlacePieceRequest) => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.post(`${process.env.REACT_APP_API_URL}/placePiece/${props.gameId}?uid=${localStorage.getItem("uid")}`, props)
		.then((result) => {
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export const startGame = (id: string) => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.post(`${process.env.REACT_APP_API_URL}/startGame/${id}?uid=${localStorage.getItem("uid")}`)
		.then((result) => {
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export const createGame = () => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.post(`${process.env.REACT_APP_API_URL}/createGame?uid=${localStorage.getItem("uid")}`)
		.then((result) => {
			dispatch(createGameReducer(result.data));
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export const connectToGame = (id: string) => (dispatch: AppDispatch) => {
	const eventSource = new EventSource(
		`${process.env.REACT_APP_API_URL}/gameStream/${id}
		?uid=${localStorage.getItem("uid")}
		&usr=${localStorage.getItem("username")}`
	);
	eventSource.addEventListener("message", (ev) => {
		console.log(ev.data);
		dispatch(getGameUpdateReducer(JSON.parse(ev.data)));
	});
	eventSource.addEventListener("error", (ev) => {
		dispatch(disconnectFromGame());
	});
	dispatch(connectToGameReducer(eventSource));
};

export const disconnectFromGame = () => (dispatch: AppDispatch) => {
	dispatch(disconnectFromGameReducer(null));
};

export default mainSlice.reducer;

