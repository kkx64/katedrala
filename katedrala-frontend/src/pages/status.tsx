import "../styles/game.scss";
import { useEffect, useState } from "react";

import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from "recharts";

import { useAppSelector, useAppDispatch, RootState } from "../redux/store";
import { getStatus } from "../redux/slices/mainSlice";

const StatusPage = () => {
	const dispatch = useAppDispatch();
	const { status } = useAppSelector((state: RootState) => state.main);

	const [interval, setStateInterval] = useState(null as null | NodeJS.Timer);
	const [frequency, setFrequency] = useState(5000);

	const [cpuTrend, setCpuTrend] = useState([] as Array<{ name: string; val: number }>);
	const [memoryTrend, setMemoryTrend] = useState([] as Array<{ name: string; val: number }>);
	const [gamesTrend, setGamesTrend] = useState([] as Array<{ name: string; val: number }>);

	useEffect(() => {
		if (interval) clearInterval(interval);
		setStateInterval(
			setInterval(() => {
				dispatch(getStatus());
			}, frequency)
		);
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [frequency]);

	useEffect(() => {
		dispatch(getStatus());
	}, []);

	useEffect(() => {
		if (status) {
			const newCpuTrend = [...cpuTrend];
			if (newCpuTrend.length >= 30) newCpuTrend.splice(0, 1);
			newCpuTrend.push({
				name: new Date().toTimeString().slice(0, 8),
				val: Math.round((status.avgLoad[0] + status.avgLoad[1] + status.avgLoad[2]) / 3),
			});
			setCpuTrend(newCpuTrend);

			const newMemTrend = [...memoryTrend];
			if (newMemTrend.length >= 30) newMemTrend.splice(0, 1);
			newMemTrend.push({
				name: new Date().toTimeString().slice(0, 8),
				val: Math.round(((status.totalMemory - status.freeMemory) / status.totalMemory) * 100),
			});
			setMemoryTrend(newMemTrend);

			const newGameTrend = [...gamesTrend];
			if (newGameTrend.length >= 30) newGameTrend.splice(0, 1);
			newGameTrend.push({
				name: new Date().toTimeString().slice(0, 8),
				val: status.activeGames,
			});
			setGamesTrend(newGameTrend);
		}
	}, [status]);

	if (!status) return <div></div>;

	return (
		<div className="w-full flex flex-col lg:items-start px-4 lg:px-[5vw] justify-start gap-4">
			<div className="font-extrabold text-3xl">Server Status</div>
			<div className="w-full flex flex-col gap-2">
				<div>Refresh Speed</div>
				<select
					value={frequency}
					className="bg-gray-800 rounded-lg p-2 w-full"
					onChange={(e) => {
						setFrequency(parseInt(e.target.value));
					}}
				>
					<option value={1000}>1s</option>
					<option value={2000}>2s</option>
					<option value={5000}>5s</option>
					<option value={10000}>10s</option>
					<option value={30000}>30s</option>
				</select>
			</div>

			<div className="w-full flex flex-col lg:flex-row lg:flex-wrap lg:items-stretch justify-start gap-4">
				<div className="bg-gray-800 p-4 lg:p-6 rounded-xl flex-1 flex flex-col gap-4">
					<div className="opacity-40">Server Uptime</div>
					<div className="text-5xl font-extrabold">{new Date(status.uptime * 1000).toISOString().slice(11, 19)}</div>
				</div>
				<div className="bg-gray-800 p-4 lg:p-6 rounded-xl w-full flex flex-col gap-4">
					<div className="opacity-40">Active Games</div>
					<div className="text-5xl font-extrabold">{status.activeGames}</div>
					<div className="w-full">
						<ResponsiveContainer width={"100%"} height={200}>
							<LineChart data={gamesTrend}>
								<Line isAnimationActive={false} type="monotone" dataKey="val" strokeWidth={3} stroke="#eab308" />
								<YAxis width={20} domain={["dataMin", "dataMax"]} />
								<XAxis dataKey="name" />
								<CartesianGrid stroke="#ffffff11" strokeDasharray="5 5" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="bg-gray-800 p-4 lg:p-6 rounded-xl w-full flex flex-col gap-4">
					<div className="opacity-40">Memory Usage</div>
					<div className="text-5xl font-extrabold">
						{(((status.totalMemory - status.freeMemory) / status.totalMemory) * 100).toFixed(1)}
						<span className="text-xl">%</span>
					</div>
					<div>
						<span className="text-xl font-bold">
							{((status.totalMemory - status.freeMemory) / 1048576).toFixed(0)}{" "}
						</span>
						MB / <span className="text-xl font-bold">{(status.totalMemory / 1048576).toFixed(0)}</span> MB
					</div>
					<div>
						<progress
							value={status.totalMemory - status.freeMemory}
							max={status.totalMemory}
							className="w-full rounded-xl"
						/>
					</div>
					<div className="w-full">
						<ResponsiveContainer width={"100%"} height={200}>
							<LineChart data={memoryTrend}>
								<Line isAnimationActive={false} type="monotone" dataKey="val" strokeWidth={3} stroke="#eab308" />
								<YAxis
									domain={[
										"dataMin-1",
										(dataMax: number) =>
											dataMax >= 100 ? 100 : dataMax >= 90 ? dataMax + (100 - dataMax) : dataMax + 10,
									]}
								/>
								<XAxis dataKey="name" />
								<CartesianGrid stroke="#ffffff11" strokeDasharray="5 5" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="bg-gray-800 p-4 lg:p-6 rounded-xl w-full flex flex-col gap-4">
					<div className="opacity-40">CPU Usage</div>
					<div className="flex flex-row gap-4 flex-wrap">
						<div className="flex flex-col">
							<div>5 Minutes</div>
							<div className="text-5xl font-extrabold">
								{status.avgLoad[0].toFixed(2)}
								<span className="text-xl">%</span>
							</div>
						</div>
						<div className="flex flex-col">
							<div>10 Minutes</div>
							<div className="text-5xl font-extrabold">
								{status.avgLoad[1].toFixed(2)}
								<span className="text-xl">%</span>
							</div>
						</div>
						<div className="flex flex-col">
							<div>15 Minutes</div>
							<div className="text-5xl font-extrabold">
								{status.avgLoad[2].toFixed(2)}
								<span className="text-xl">%</span>
							</div>
						</div>
					</div>
					<div>
						<progress
							value={(status.avgLoad[0] + status.avgLoad[1] + status.avgLoad[2]) / 3}
							max={100}
							className="w-full rounded-xl"
						/>
					</div>
					<div className="w-full">
						<ResponsiveContainer width={"100%"} height={200}>
							<LineChart data={cpuTrend}>
								<Line isAnimationActive={false} type="monotone" dataKey="val" strokeWidth={3} stroke="#eab308" />
								<YAxis
                                width={24}
									domain={[
										(dataMin: number) => (dataMin <= 10 ? 0 : dataMin - 10),
										(dataMax: number) =>
											dataMax >= 100 ? 100 : dataMax >= 90 ? dataMax + (100 - dataMax) : dataMax + 1,
									]}
								/>
								<XAxis dataKey="name" />
								<CartesianGrid stroke="#ffffff11" strokeDasharray="5 5" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StatusPage;

