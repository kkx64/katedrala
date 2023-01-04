import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createGame } from "../redux/slices/mainSlice";
import { useAppSelector, useAppDispatch, RootState } from "../redux/store";

import returnPiece from "../assets/returnpiece.gif";
import territory from "../assets/territory.gif";
import noplace from "../assets/noplace.gif";

const HomePage = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [joiningGameId, setJoiningGameId] = useState("");

	const { createdGameId } = useAppSelector((state: RootState) => state.main);

	useEffect(() => {
		if (!localStorage.getItem("username")) navigate("/username");
	}, []);

	useEffect(() => {
		if (createdGameId) {
			navigate(`/game/${createdGameId}`);
		}
	}, [createdGameId]);

	return (
		<div className="w-full">
			<ins
				className="adsbygoogle"
				style={{ display: "block" }}
				data-ad-client="ca-pub-7823764966313439"
				data-ad-slot="8799023165"
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
			<header className="text-4xl relative w-full h-fit">
				<h1 className="lg:absolute left-0 -top-28 z-0 opacity-10 text-[11vw] w-full text-center">KATEDRALA</h1>
			</header>

			<div className=" h-fit mt-12 z-[1] flex flex-col lg:flex-row items-stretch w-full gap-12">
				<div className="flex-1 flex flex-col gap-4 justify-evenly bg-blue-600 bg-opacity-40 p-8 lg:p-16 rounded-2xl ring ring-blue-500">
					<p className="text-2xl font-bold">Create Game</p>
					<button
						onClick={() => {
							dispatch(createGame());
						}}
						className="px-8 py-4 bg-blue-600 rounded-xl"
					>
						Create
					</button>
				</div>
				<div className="flex-1 flex flex-col justify-evenly gap-4 bg-yellow-600 bg-opacity-40 p-8 lg:p-16 rounded-2xl ring ring-yellow-500">
					<p className="text-2xl font-bold">Join Game</p>
					<input
						className="bg-yellow-600 focus:ring focus:ring-yellow-600 bg-opacity-10 rounded-xl p-4"
						placeholder="8XACQ1"
						onChange={(e) => {
							setJoiningGameId(e.target.value);
						}}
					/>
					<button
						onClick={() => {
							navigate(`/game/${joiningGameId}`);
						}}
						className="px-8 py-4 bg-yellow-600 rounded-xl"
					>
						Join
					</button>
				</div>
			</div>
			<div className="mt-24 flex flex-col gap-4">
				<h3 className="text-xl">What is KATEDRALA?</h3>
				<p>
					KATEDRALA is a fun board game based around placing blocks and territorial control. The game exists as a{" "}
					<a target={"_blank"} rel="noreferrer" href="https://boardgamegeek.com/boardgame/7/cathedral">
						regular board game (originally called Cathedral)
					</a>
					, and this website is simply a free playable browser-based version.{" "}
					<span className="opacity-50">
						(If you like this game, you should definitely give the real-life version a try)
					</span>
				</p>
				<p>
					{" "}
					The code for this game is available on{" "}
					<a target={"_blank"} rel="noreferrer" href="https://github.com/kkx64/katedrala">
						GitHub
					</a>
					, and I encourage anyone that comes accross it to try and develop their own front-end for the game, as a
					challenge.
				</p>
				<p className="opacity-50 text-sm">
					Please message me if you've made a commandline playable version, that would be cool.
				</p>
				<h3 className="text-xl mt-12">Alright, I'm sold. How do I play?</h3>
				<p>The rules to the game are simple:</p>
				<ul className=" list-disc">
					<li>You take turns placing blocks on the board.</li>
					<li>The Cathedral piece (white) is already placed.</li>
					<li>The game ends when no more pieces can be placed.</li>
					<li>
						The player whose <b>remaining pieces</b> take up <b>the least amount of places</b> wins.
					</li>
				</ul>
				<p>Some more details:</p>
				<ul className=" list-disc">
					<li>Surrounding an area with your pieces makes that area your "territory."</li>
					<img src={territory} alt="territory" width={300} />
					<li>
						Any pieces of the opposing player that are inside your territory are returned to their hand.{" "}
						<b>(including the Cathedral!)</b>
					</li>
					<img src={returnPiece} alt="territory" width={300} />
					<li>You cannot place pieces inside the opposing player's territory.</li>
					<img src={noplace} alt="territory" width={300} />
					<li>
						Territories are only created with side-to-side placed pieces. Corner-to-corner connections do not count. The
						edge of the board also counts as blocks with which you can create territories.
					</li>
				</ul>
				<p>The controls:</p>
				<p>
					Your pieces are lined up at the bottom. Select a piece by clicking on it. You can rotate the piece by pressing{" "}
					<span className="p-2 px-3 bg-gray-600 rounded-lg">R</span>. Click on the board to place the piece.
				</p>
				<div>
					You can start a game with the
					<div className="px-16 py-4 bg-blue-600 rounded-xl text-center inline-block">Create</div> button.
				</div>
				<p>You will get a generated game ID (looks something like this: ABC12D).</p>
				<div>
					You can join a game by typing the game ID into the input under the <b>Join Game</b> text, and then clicking{" "}
					<div className="px-16 py-4 bg-yellow-600 rounded-xl text-center place-self-start inline-block">Join</div>
				</div>
				<p>You can also spectate others' games (and vice versa) by "joining" a game in progress.</p>
				<h3 className="text-xl mt-12">Cool. What's the deal with the ads though?</h3>
				<p>
					Hosting unfortunately costs money, it was either banner ads, making the game paid, or the dreaded popups. If
					you'd like to help me keep the game online, and create more free open-source projects, you can help me out{" "}
					<a href="https://www.buymeacoffee.com/kirilkrsteski" target="_blank" rel="noreferrer">
						here.
					</a>
				</p>
				<h3 className="text-xl mt-12">How can I reach out?</h3>
				<p>
					Send an email to <a href="mailto:kiril@playkatedrala.com">kiril@playkatedrala.com</a>.
				</p>
				<ins
					className="adsbygoogle"
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

