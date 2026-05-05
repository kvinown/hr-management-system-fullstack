import { useState, useEffect } from "react";
import api from "../../lib/axios";

export default function EmployeeDashboard() {
	const [time, setTime] = useState(new Date());
	const [clockLoading, setClockLoading] = useState(false);

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const handleClockIn = async () => {
		setClockLoading(true);
		try {
			const res = await api.post("/attendances/clock-in");
			alert(`✅ Clock In Success!\nStatus: ${res.data.status}`);
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setClockLoading(false);
		}
	};

	const handleClockOut = async () => {
		setClockLoading(true);
		try {
			const res = await api.post("/attendances/clock-out");
			alert(`✅ Clock Out Success!`);
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setClockLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-full min-h-[70vh]">
			<div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl text-center w-full max-w-md border border-transparent dark:border-gray-700 transition-colors">
				<h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back!</h1>
				<p className="text-gray-500 dark:text-gray-400 mb-8">Ready to start your day?</p>

				<div className="text-5xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-8">{time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>

				<div className="flex flex-col gap-4">
					<button
						onClick={handleClockIn}
						disabled={clockLoading}
						className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-xl shadow-md transition disabled:opacity-50">
						{clockLoading ? "Processing..." : "CLOCK IN"}
					</button>
					<button
						onClick={handleClockOut}
						disabled={clockLoading}
						className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-xl shadow-md transition disabled:opacity-50">
						{clockLoading ? "Processing..." : "CLOCK OUT"}
					</button>
				</div>
			</div>
		</div>
	);
}
