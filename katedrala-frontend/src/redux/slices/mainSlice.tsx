import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { AppDispatch, RootState } from "../store";
import Game from "../models/Game";
import axios from "axios";
import StatusResponse from "../models/StatusResponse";

const API_URL =
	process.env.NODE_ENV === "development" ? process.env.REACT_APP_API_URL_DEV : process.env.REACT_APP_API_URL;

interface CurrentGameInfo {
	id: string;
	creator: string;
	numPlayers: number;
	createdAt: number;
	lastMoveTime: number;
	lastPlayerTime: number;
	finished: boolean;
}

interface MainState {
	currentGame: null | Game;
	pieces: boolean[][][];
	loading: boolean;
	createdGameId: string | null;
	gameStreamSource: null | EventSource;
	myUid: null | string;
	status: null | StatusResponse;
	currentGames: CurrentGameInfo[]; // New state property
}

const initialState: MainState = {
	currentGame: null,
	pieces: [],
	loading: false,
	createdGameId: null,
	gameStreamSource: null,
	myUid: null,
	status: null,
	currentGames: [], // Initialize current games array
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
		getStatusReducer: (state, action) => {
			state.status = action.payload;
		},
		getCurrentGamesReducer: (state, action) => {
			state.currentGames = action.payload;
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
	getStatusReducer,
	getCurrentGamesReducer,
} = mainSlice.actions;

// * ACTIONS

export const refreshMyUid = () => (dispatch: AppDispatch) => {
	dispatch(setMyUidReducer(null));
};

export const getId = () => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.get(`${API_URL}/getId`)
		.then((result) => {
			dispatch(setLoadingReducer(false));
			dispatch(getIdReducer(result.data));
		})
		.catch((error) => {
			dispatch(setLoadingReducer(false));
			console.error(error);
		});
};

export const getPieces = () => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.get(`${API_URL}/getPieces`)
		.then((result) => {
			dispatch(setLoadingReducer(false));
			dispatch(getPiecesReducer(result.data));
		})
		.catch((error) => {
			dispatch(setLoadingReducer(false));
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
		.post(`${API_URL}/placePiece/${props.gameId}?uid=${localStorage.getItem("uid")}`, props)
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
		.post(`${API_URL}/startGame/${id}?uid=${localStorage.getItem("uid")}`)
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
		.post(`${API_URL}/createGame?uid=${localStorage.getItem("uid")}`)
		.then((result) => {
			dispatch(createGameReducer(result.data));
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export const getCurrentGames = () => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.get(`${API_URL}/currentGames`)
		.then((result) => {
			dispatch(getCurrentGamesReducer(result.data));
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export const connectToGame = (id: string) => (dispatch: AppDispatch) => {
	const eventSource = new EventSource(
		`${API_URL}/gameStream/${id}
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

export const getStatus = () => (dispatch: AppDispatch) => {
	dispatch(setLoadingReducer(true));
	axios
		.get(`${API_URL}/status`)
		.then((result) => {
			dispatch(getStatusReducer(result.data));
			dispatch(setLoadingReducer(false));
		})
		.catch((error) => {
			console.error(error);
			dispatch(setLoadingReducer(false));
		});
};

export default mainSlice.reducer;

