import { useState, useEffect } from "react";
import api from "../lib/axios";

export default function EmployeeDashboard() {
	const [time, setTime] = useState(new Date());
	const [loading, setLoading] = useState(false);

	// Jam Real-time
	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const handleClockIn = async () => {
		setLoading(true);
		try {
			// Menembak endpoint clock-in dari attendance.routes.ts
			const res = await api.post("/attendances/clock-in");
			alert(`✅ Clock In Success!\nStatus: ${res.data.status}`);
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleClockOut = async () => {
		setLoading(true);
		try {
			// Menembak endpoint clock-out dari attendance.routes.ts
			const res = await api.post("/attendances/clock-out");
			alert(`✅ Clock Out Success!`);
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-[80vh]">
			<div className="bg-white p-10 rounded-2xl shadow-lg text-center w-[400px]">
				<h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
				<p className="text-gray-500 mb-8">Ready to start your day?</p>

				<div className="text-5xl font-mono font-bold text-blue-600 mb-8">{time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>

				<div className="flex flex-col gap-4">
					<button
						onClick={handleClockIn}
						disabled={loading}
						className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-xl shadow-md transition disabled:opacity-50">
						CLOCK IN
					</button>

					<button
						onClick={handleClockOut}
						disabled={loading}
						className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-xl shadow-md transition disabled:opacity-50">
						CLOCK OUT
					</button>
				</div>
			</div>
		</div>
	);
}
