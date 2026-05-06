import { useState, useEffect } from "react";
import api from "../../lib/axios";

export default function Settings() {
	const [settings, setSettings] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchSettings();
	}, []);

	const fetchSettings = async () => {
		try {
			const res = await api.get("/settings");
			setSettings(res.data.data);
		} catch (err) {
			alert("Failed to load settings");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (key: string, newValue: string) => {
		setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: newValue } : s)));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const updates = settings.map((s) => ({ key: s.key, value: s.value }));
			await api.put("/settings/bulk", { updates });
			alert("Settings updated successfully! 🚀");
		} catch (err) {
			alert("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div className="p-10 text-center">Loading Configuration...</div>;

	// Helper untuk mengambil value berdasarkan key
	const getVal = (key: string) => settings.find((s) => s.key === key)?.value || "";

	return (
		<div className="max-w-5xl mx-auto space-y-8 p-4">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">System Settings</h1>
					<p className="text-gray-500 dark:text-gray-400">Configure geofencing, penalties, and automation rules.</p>
				</div>
				<button
					onClick={handleSave}
					disabled={saving}
					className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50">
					{saving ? "Saving..." : "Save Changes"}
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* CARD 1: GEOFENCING CONFIG */}
				<div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">📍</div>
						<h3 className="text-xl font-bold text-gray-800 dark:text-white">Geofencing & Location</h3>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Office Latitude</label>
							<input
								type="text"
								value={getVal("OFFICE_LAT")}
								onChange={(e) => handleChange("OFFICE_LAT", e.target.value)}
								className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 ring-blue-500 outline-none"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Office Longitude</label>
							<input
								type="text"
								value={getVal("OFFICE_LNG")}
								onChange={(e) => handleChange("OFFICE_LNG", e.target.value)}
								className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 ring-blue-500 outline-none"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Max Radius (Meters)</label>
							<input
								type="number"
								value={getVal("MAX_GEOFENCE_RADIUS")}
								onChange={(e) => handleChange("MAX_GEOFENCE_RADIUS", e.target.value)}
								className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 ring-blue-500 outline-none"
							/>
						</div>
					</div>
				</div>

				{/* CARD 2: AUTOMATION & PENALTY */}
				<div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600">⏱️</div>
						<h3 className="text-xl font-bold text-gray-800 dark:text-white">Rules & Penalties</h3>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Late Penalty (IDR / Minute)</label>
							<input
								type="number"
								value={getVal("LATE_PENALTY_PER_MINUTE")}
								onChange={(e) => handleChange("LATE_PENALTY_PER_MINUTE", e.target.value)}
								className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 ring-orange-500 outline-none"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Auto Clock-Out Time</label>
							<input
								type="time"
								value={getVal("AUTO_CLOCK_OUT_TIME")}
								onChange={(e) => handleChange("AUTO_CLOCK_OUT_TIME", e.target.value)}
								className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 ring-orange-500 outline-none"
							/>
						</div>
						<p className="text-[11px] text-gray-400 italic">*System will automatically clock-out employees who forget to do so at this time.[cite: 7]</p>
					</div>
				</div>
			</div>
		</div>
	);
}
