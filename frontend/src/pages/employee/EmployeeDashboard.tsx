import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import api from "../../lib/axios";
import { jwtDecode } from "jwt-decode";
import { MapPin, Camera, CameraOff, CheckCircle2, AlertCircle, Clock, Calendar, Timer, Fingerprint } from "lucide-react";

export default function EmployeeDashboard() {
	const [time, setTime] = useState(new Date());
	const [clockLoading, setClockLoading] = useState(false);

	// State Identitas
	const [userName, setUserName] = useState("Employee");

	// State Sensor & Izin
	const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
	const [gpsStatus, setGpsStatus] = useState<"checking" | "connected" | "error">("checking");
	const [isCameraOpen, setIsCameraOpen] = useState(false);

	// State Kamera
	const webcamRef = useRef<Webcam>(null);
	const [imgSrc, setImgSrc] = useState<string | null>(null);

	// 🔥 Dummy Data Statistik Personal Karyawan
	const stats = {
		shift: "08:00 - 17:00",
		lateThisMonth: 2,
		leaveBalance: 12,
		overtimeMins: 150,
	};

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);

		// Ambil nama dari token
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				const decoded: any = jwtDecode(token);
				setUserName(decoded.name || "Employee");
			} catch (err) {}
		}

		checkGpsPermission();
		return () => clearInterval(timer);
	}, []);

	// Fungsi Cek Lokasi Diam-diam
	const checkGpsPermission = () => {
		setGpsStatus("checking");
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
					setGpsStatus("connected");
				},
				(err) => {
					setGpsStatus("error");
				},
				{ enableHighAccuracy: true },
			);
		} else {
			setGpsStatus("error");
		}
	};

	// 🔥 Fungsi Meminta Akses Paksa (Kamera & GPS)
	const requestPermissions = async () => {
		try {
			// Pancing izin kamera
			await navigator.mediaDevices.getUserMedia({ video: true });
			// Pancing izin GPS
			checkGpsPermission();
			alert("Permissions granted! You can now turn on the camera.");
		} catch (err) {
			alert("Please allow Camera and Location access in your browser settings (usually near the URL bar).");
		}
	};

	const capture = useCallback(() => {
		if (!webcamRef.current) return null;
		const imageSrc = webcamRef.current.getScreenshot();
		setImgSrc(imageSrc || null);
		return imageSrc;
	}, [webcamRef]);

	const handleClockAction = async (type: "in" | "out") => {
		setClockLoading(true);
		try {
			let photoToSubmit = imgSrc;

			// Jika belum jepret tapi kamera nyala, otomatis jepret
			if (!photoToSubmit && isCameraOpen) {
				photoToSubmit = capture();
			}

			if (!photoToSubmit) {
				throw new Error("Please turn on the camera and take a selfie first.");
			}

			if (!currentCoords) {
				throw new Error("GPS not connected. Please enable location.");
			}

			const payload = {
				lat: currentCoords.lat,
				lng: currentCoords.lng,
				photo: photoToSubmit,
			};

			const endpoint = type === "in" ? "/attendances/clock-in" : "/attendances/clock-out";
			const res = await api.post(endpoint, payload); // Mengirim payload sesuai endpoint[cite: 6]

			alert(`✅ Success: ${type === "in" ? "Clock In" : "Clock Out"} recorded!`);
			setImgSrc(null);
			setIsCameraOpen(false); // Matikan kamera setelah berhasil
		} catch (err: any) {
			alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setClockLoading(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
			{/* HEADER & MINI CARDS */}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-transparent dark:border-gray-700">
				<div className="flex flex-col md:flex-row justify-between items-center gap-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome back, {userName}!</h1>
						<p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
							<Clock size={16} /> Today's Shift: <span className="font-bold text-blue-600 dark:text-blue-400">{stats.shift}</span>
						</p>
					</div>

					<div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
						<div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl flex-shrink-0 flex items-center gap-4">
							<div className="p-2 bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-400 rounded-xl">
								<AlertCircle size={20} />
							</div>
							<div>
								<p className="text-xs font-bold text-orange-600/80 dark:text-orange-400/80 uppercase">Late</p>
								<p className="text-lg font-bold text-orange-700 dark:text-orange-400">{stats.lateThisMonth}x</p>
							</div>
						</div>
						<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl flex-shrink-0 flex items-center gap-4">
							<div className="p-2 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-xl">
								<Calendar size={20} />
							</div>
							<div>
								<p className="text-xs font-bold text-green-600/80 dark:text-green-400/80 uppercase">Leave Bal.</p>
								<p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.leaveBalance} Days</p>
							</div>
						</div>
						<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl flex-shrink-0 flex items-center gap-4">
							<div className="p-2 bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 rounded-xl">
								<Timer size={20} />
							</div>
							<div>
								<p className="text-xs font-bold text-purple-600/80 dark:text-purple-400/80 uppercase">Overtime</p>
								<p className="text-lg font-bold text-purple-700 dark:text-purple-400">{stats.overtimeMins} Mins</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ATTENDANCE SECTION */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* KIRI: DIGITAL CLOCK & ACTION BUTTONS */}
				<div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 flex flex-col justify-center items-center text-center">
					<div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full mb-6">
						<Fingerprint size={48} />
					</div>
					<div className="text-5xl md:text-6xl font-mono font-black text-gray-800 dark:text-white mb-2 tracking-tighter">{time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
					<p className="text-gray-500 dark:text-gray-400 font-medium mb-8">{time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

					<div className="w-full flex gap-4">
						<button
							onClick={() => handleClockAction("in")}
							disabled={clockLoading || gpsStatus === "error"}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
							{clockLoading ? "..." : "CLOCK IN"}
						</button>
						<button
							onClick={() => handleClockAction("out")}
							disabled={clockLoading || gpsStatus === "error"}
							className="flex-1 bg-gray-800 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
							{clockLoading ? "..." : "CLOCK OUT"}
						</button>
					</div>
				</div>

				{/* KANAN: SENSOR & CAMERA MODULE */}
				<div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 flex flex-col">
					{/* Status Bar */}
					<div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
						<div className="flex items-center gap-2">
							<MapPin
								size={18}
								className={gpsStatus === "connected" ? "text-green-500" : "text-red-500"}
							/>
							<span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">GPS: {gpsStatus === "connected" ? "Connected" : gpsStatus === "checking" ? "Locating..." : "Disconnected"}</span>
						</div>
						{gpsStatus === "error" && (
							<button
								onClick={requestPermissions}
								className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition">
								Fix Permission
							</button>
						)}
						{gpsStatus === "connected" && currentCoords && (
							<span className="text-[10px] font-mono text-gray-400">
								{currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
							</span>
						)}
					</div>

					{/* Camera Area */}
					<div className="flex-grow flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden relative min-h-[250px] border-2 border-dashed border-gray-300 dark:border-gray-700">
						{imgSrc ? (
							<>
								<img
									src={imgSrc}
									alt="Selfie"
									className="w-full h-full object-cover"
								/>
								<button
									onClick={() => setImgSrc(null)}
									className="absolute bottom-4 bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-black transition backdrop-blur-sm">
									Retake Photo
								</button>
							</>
						) : isCameraOpen ? (
							<>
								<Webcam
									audio={false}
									ref={webcamRef}
									screenshotFormat="image/jpeg"
									videoConstraints={{ facingMode: "user" }}
									className="w-full h-full object-cover"
								/>
								<div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
									<span className="w-2 h-2 bg-white rounded-full"></span> LIVE
								</div>
							</>
						) : (
							<div className="text-center p-6">
								<div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
									<CameraOff size={32} />
								</div>
								<p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-4">Camera is currently turned off.</p>
							</div>
						)}
					</div>

					{/* Camera Toggle Button */}
					<button
						onClick={() => {
							if (isCameraOpen) {
								setIsCameraOpen(false);
								setImgSrc(null); // Reset gambar jika dimatikan
							} else {
								setIsCameraOpen(true);
							}
						}}
						className={`mt-4 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
							isCameraOpen ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
						}`}>
						{isCameraOpen ? (
							<>
								<CameraOff size={20} /> Turn Off Camera
							</>
						) : (
							<>
								<Camera size={20} /> Turn On Camera
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
