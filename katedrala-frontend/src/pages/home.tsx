import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";

import { createGame, getCurrentGames } from "../redux/slices/mainSlice";
import { useAppSelector, useAppDispatch, RootState } from "../redux/store";

import returnPiece from "../assets/returnpiece.gif";
import territory from "../assets/territory.gif";
import noplace from "../assets/noplace.gif";

import "./home.css";

dayjs.extend(relative);

const HomePage = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [joiningGameId, setJoiningGameId] = useState("");

	const { createdGameId, currentGames } = useAppSelector((state: RootState) => state.main);

	useEffect(() => {
		if (!localStorage.getItem("username")) navigate("/username");
	}, []);

	useEffect(() => {
		if (createdGameId) {
			navigate(`/game/${createdGameId}`);
		}
	}, [createdGameId]);

	useEffect(() => {
		const refresh = setInterval(() => {
			dispatch(getCurrentGames());
		}, 1000);
		dispatch(getCurrentGames());
		return () => {
			clearInterval(refresh);
		};
	}, []);

	return (
		<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<ins
				className="adsbygoogle my-4"
				style={{ display: "block" }}
				data-ad-client="ca-pub-7823764966313439"
				data-ad-slot="8799023165"
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
			<header className="relative w-full py-16 my-8">
				<h1 className="z-0 lg:text-[5vw] w-full text-center font-bold neon-glow pulse-animation tracking-wider">
					KATEDRALA
				</h1>
				<div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-full opacity-50 animate-pulse-slow"></div>
			</header>

			<div className="mt-16 z-[1] flex flex-col lg:flex-row items-stretch w-full gap-8">
				<div className="flex-1 flex flex-col gap-6 justify-evenly bg-blue-600 bg-opacity-40 p-8 lg:p-12 rounded-2xl ring-2 ring-blue-500 hover-float shadow-glow-blue transition-all duration-300">
					<p className="text-3xl font-bold text-center text-glow-blue">Create Game</p>
					<button
						onClick={() => {
							dispatch(createGame());
						}}
						className="px-8 py-5 bg-blue-600 rounded-xl text-xl font-semibold arcade-button-blue hover-pop transition-all duration-200"
					>
						Create
					</button>
				</div>
				<div className="flex-1 flex flex-col justify-evenly gap-6 bg-yellow-600 bg-opacity-40 p-8 lg:p-12 rounded-2xl ring-2 ring-yellow-500 hover-float shadow-glow-yellow transition-all duration-300">
					<p className="text-3xl font-bold text-center text-glow-yellow">Join Game</p>
					<input
						className="bg-yellow-600 focus:ring-2 focus:ring-yellow-400 bg-opacity-20 rounded-xl p-5 text-xl text-center tracking-widest transition-all duration-200"
						placeholder="8XACQ1"
						onChange={(e) => {
							setJoiningGameId(e.target.value);
						}}
					/>
					<button
						onClick={() => {
							navigate(`/game/${joiningGameId}`);
						}}
						className="px-8 py-5 bg-yellow-600 rounded-xl text-xl font-semibold arcade-button-yellow hover-pop transition-all duration-200"
					>
						Join
					</button>
				</div>
			</div>
			<div className="mt-28">
				<h3 className="text-2xl font-bold mb-6 text-glow-green neon-pulse">LIVE GAMES</h3>
				<div className="flex w-full flex-wrap gap-6 mt-8">
					{currentGames.map((game) => (
						<div
							key={game.id}
							className="flex flex-col justify-evenly gap-4 bg-green-600 w-full sm:w-80 md:w-96 bg-opacity-40 p-6 rounded-2xl ring-2 ring-green-500 hover-float shadow-glow-green transition-all duration-300"
						>
							<p className="opacity-70">Started {dayjs(game.createdAt * 1000).fromNow()}</p>
							<p className="text-5xl font-bold text-center text-glow-green tracking-wider">{game.id}</p>
							<p className="opacity-70 text-lg">Players: {game.numPlayers}</p>
							<button
								onClick={() => {
									navigate(`/game/${game.id}`);
								}}
								className="px-8 py-5 bg-green-600 rounded-xl text-xl font-semibold arcade-button-green hover-pop transition-all duration-200"
							>
								{game.numPlayers < 2 ? "Join" : "Spectate"}
							</button>
						</div>
					))}
					{currentGames.length === 0 && (
						<div className="flex-1 flex flex-col justify-evenly gap-6 bg-green-600 bg-opacity-40 p-10 lg:p-16 rounded-2xl ring-2 ring-green-500 hover-float">
							<p className="text-2xl font-bold text-glow-green">No games currently in progress</p>
							<p className="text-lg">Create one above!</p>
						</div>
					)}
				</div>
			</div>
			<div className="mt-28 flex flex-col gap-8 bg-gray-800 bg-opacity-40 p-8 rounded-3xl shadow-xl">
				<h3 className="text-2xl font-bold text-glow-blue">What is KATEDRALA?</h3>
				<p className="text-lg leading-relaxed">
					KATEDRALA is a fun board game based around placing blocks and territorial control. The game exists as a{" "}
					<a
						target={"_blank"}
						rel="noreferrer"
						href="https://boardgamegeek.com/boardgame/7/cathedral"
						className="text-blue-300 hover:text-blue-200 underline"
					>
						regular board game (originally called Cathedral)
					</a>
					, and this website is simply a free playable browser-based version.{" "}
					<span className="opacity-70">
						(If you like this game, you should definitely give the real-life version a try)
					</span>
				</p>
				<p className="text-lg leading-relaxed">
					{" "}
					The code for this game is available on{" "}
					<a
						target={"_blank"}
						rel="noreferrer"
						href="https://github.com/kkx64/katedrala"
						className="text-blue-300 hover:text-blue-200 underline"
					>
						GitHub
					</a>
					, and I encourage anyone that comes across it to try and develop their own front-end for the game, as a
					challenge.
				</p>
				<p className="opacity-70 text-sm">
					Please message me if you've made a commandline playable version, that would be cool.
				</p>
				<h3 className="text-2xl font-bold mt-8 text-glow-yellow">Alright, I'm sold. How do I play?</h3>
				<p className="text-lg leading-relaxed">The rules to the game are simple:</p>
				<ul className="list-disc pl-8 space-y-2 text-lg">
					<li>You take turns placing blocks on the board.</li>
					<li>The Cathedral piece (white) is already placed.</li>
					<li>The game ends when no more pieces can be placed.</li>
					<li>
						The player whose <b>remaining pieces</b> take up <b>the least amount of places</b> wins.
					</li>
				</ul>
				<p className="text-lg leading-relaxed pt-4">Some more details:</p>
				<ul className="list-disc pl-8 space-y-6 text-lg">
					<li>Surrounding an area with your pieces makes that area your "territory."</li>
					<div className="flex justify-center my-2">
						<img src={territory} alt="territory" width={300} className="rounded-lg shadow-lg hover-float" />
					</div>
					<li>
						Any pieces of the opposing player that are inside your territory are returned to their hand.{" "}
						<b>(including the Cathedral!)</b>
					</li>
					<div className="flex justify-center my-2">
						<img src={returnPiece} alt="returning a piece" width={300} className="rounded-lg shadow-lg hover-float" />
					</div>
					<li>You cannot place pieces inside the opposing player's territory.</li>
					<div className="flex justify-center my-2">
						<img src={noplace} alt="cannot place" width={300} className="rounded-lg shadow-lg hover-float" />
					</div>
					<li>
						Territories are only created with side-to-side placed pieces. Corner-to-corner connections do not count. The
						edge of the board also counts as blocks with which you can create territories.
					</li>
				</ul>
				<p className="text-xl font-semibold pt-6">The controls:</p>
				<p className="text-lg leading-relaxed">
					Your pieces are lined up at the bottom. Select a piece by clicking on it. You can rotate the piece by pressing{" "}
					<span className="p-2 px-3 bg-gray-700 rounded-lg font-mono">R</span>. Click on the board to place the piece.
				</p>
				<div className="mt-4 flex flex-col gap-4">
					<p className="text-lg">
						You can start a game with the{" "}
						<span className="px-6 py-2 bg-blue-600 rounded-lg text-center inline-block arcade-button-blue mx-2">
							Create
						</span>{" "}
						button.
					</p>
					<p className="text-lg">
						You will get a generated game ID (looks something like this:{" "}
						<span className="font-mono bg-gray-700 px-2 py-1 rounded">ABC12D</span>).
					</p>
					<p className="text-lg">
						You can join a game by typing the game ID into the input under the <b>Join Game</b> text, and then clicking{" "}
						<span className="px-6 py-2 bg-yellow-600 rounded-lg text-center inline-block arcade-button-yellow mx-2">
							Join
						</span>
					</p>
					<p className="text-lg">
						You can also spectate others' games (and vice versa) by "joining" a game in progress.
					</p>
				</div>
				<h3 className="text-2xl font-bold mt-8 text-glow-green">Cool. What's the deal with the ads though?</h3>
				<p className="text-lg leading-relaxed">
					Hosting unfortunately costs money, it was either banner ads, making the game paid, or the dreaded popups. If
					you'd like to help me keep the game online, and create more free open-source projects, you can help me out{" "}
					<a
						href="https://www.buymeacoffee.com/kirilkrsteski"
						target="_blank"
						rel="noreferrer"
						className="text-yellow-300 hover:text-yellow-200 underline transition-colors"
					>
						here.
					</a>
				</p>
				<h3 className="text-2xl font-bold mt-8 text-glow-blue">How can I reach out?</h3>
				<p className="text-lg leading-relaxed">
					Send an email to{" "}
					<a
						href="mailto:kiril@playkatedrala.com"
						className="text-blue-300 hover:text-blue-200 underline transition-colors"
					>
						kiril@playkatedrala.com
					</a>
					.
				</p>
				<ins
					className="adsbygoogle mt-8"
					style={{ display: "block" }}
					data-ad-client="ca-pub-7823764966313439"
					data-ad-slot="2042043128"
					data-ad-format="auto"
					data-full-width-responsive="true"
				></ins>
			</div>
		</div>
	);
};

export default HomePage;

