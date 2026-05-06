import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { io, Socket } from "socket.io-client";
import api from "../lib/axios";
import { Bell, Megaphone, Send, Info, CheckCircle2 } from "lucide-react";
import socket from "../lib/socket";

type DecodedToken = {
	id: string;
	email: string;
	role: string;
	name?: string;
	exp: number;
};

type NavbarProps = {
	onOpenMenu: () => void;
	theme: string;
	toggleTheme: (e: React.MouseEvent) => void;
};

export default function Navbar({ onOpenMenu, theme, toggleTheme }: NavbarProps) {
	const [user, setUser] = useState<DecodedToken | null>(null);
	const [greeting, setGreeting] = useState("Hello");
	const [currentDate, setCurrentDate] = useState("");
	const [currentTime, setCurrentTime] = useState("");

	// 🔥 STATE NOTIFIKASI & SOCKET
	const [notifications, setNotifications] = useState<any[]>([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const [showBroadcastModal, setShowBroadcastModal] = useState(false);
	const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "" });
	const [isBroadcasting, setIsBroadcasting] = useState(false);

	const dropdownRef = useRef<HTMLDivElement>(null);

	// 1. Inisialisasi User & Waktu
	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				const decoded: DecodedToken = jwtDecode(token);
				setUser(decoded);
				fetchNotifications(); // Ambil riwayat notif saat baru login
			} catch (err) {}
		}

		const updateDateTime = () => {
			const now = new Date();
			const hour = now.getHours();
			if (hour < 12) setGreeting("Good Morning");
			else if (hour < 18) setGreeting("Good Afternoon");
			else setGreeting("Good Evening");

			setCurrentDate(now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
			setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
		};
		updateDateTime();
		const timer = setInterval(updateDateTime, 1000);
		return () => clearInterval(timer);
	}, []);

	// 2. Fetch Riwayat Notifikasi
	const fetchNotifications = async () => {
		try {
			const res = await api.get("/notifications");
			setNotifications(res.data.data || []);
		} catch (err) {
			console.error("Failed to fetch notifications");
		}
	};

	// 🔥 3. SETUP SOCKET.IO CLIENT
	useEffect(() => {
		if (!user) return;

		// Mendengarkan Broadcast Global dari HR
		const handleNewNotification = (notification: any) => {
			setNotifications((prev) => [notification, ...prev]);
		};

		// Mendengarkan Notifikasi Personal
		const handlePersonalNotification = (notification: any) => {
			setNotifications((prev) => [notification, ...prev]);
		};

		socket.on("new_notification", handleNewNotification);
		socket.on(`notification_${user.id}`, handlePersonalNotification);

		return () => {
			// Matikan listener spesifik untuk komponen ini saja agar tidak memory leak
			socket.off("new_notification", handleNewNotification);
			socket.off(`notification_${user.id}`, handlePersonalNotification);
		};
	}, [user]);

	// Tutup dropdown jika klik di luar
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowNotifDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// 4. Mark As Read
	const handleMarkAsRead = async (id: string) => {
		try {
			await api.patch(`/notifications/${id}/read`);
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
		} catch (err) {
			console.error(err);
		}
	};

	// 5. Submit Broadcast (Khusus HR)
	const handleSendBroadcast = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsBroadcasting(true);
		try {
			await api.post("/notifications/broadcast", broadcastForm);
			setBroadcastForm({ title: "", message: "" });
			setShowBroadcastModal(false);
			// Kita tidak perlu alert sukses, karena layar kita sendiri akan langsung menerima notif dari socket! 😎
		} catch (err) {
			alert("Failed to send broadcast");
		} finally {
			setIsBroadcasting(false);
		}
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<div className="relative h-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 md:px-8 transition-colors duration-300 flex-shrink-0 z-40">
			{/* BAGIAN KIRI */}
			<div className="flex items-center gap-4">
				<button
					onClick={onOpenMenu}
					className="md:hidden text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 focus:outline-none p-2 rounded-lg bg-gray-50 dark:bg-gray-900 transition-colors">
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				<div className="hidden md:flex flex-col justify-center">
					<h2 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-wide">
						{greeting}, <span className="text-blue-600 dark:text-blue-400">{user?.name || "Admin"}</span>!
					</h2>
					<div className="flex items-center gap-2 mt-0.5">
						<p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{currentDate}</p>
						<span className="text-gray-300 dark:text-gray-600">|</span>
						<p className="text-sm text-gray-500 dark:text-gray-400 font-mono font-medium">{currentTime}</p>
					</div>
				</div>
			</div>

			{/* BAGIAN KANAN */}
			<div className="flex items-center gap-3 sm:gap-6">
				<div className="md:hidden flex flex-col items-end">
					<span className="text-gray-800 dark:text-white font-bold text-sm">{user?.name || "User"}</span>
					<span className="text-gray-500 dark:text-gray-400 text-xs font-mono mt-0.5">{currentTime}</span>
				</div>

				<div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

				{/* 🔥 TOMBOL BROADCAST (HANYA MUNCUL JIKA HR) */}
				{user?.role !== "EMPLOYEE" && (
					<button
						onClick={() => setShowBroadcastModal(true)}
						className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl font-bold text-sm transition-colors">
						<Megaphone size={18} />
						Broadcast
					</button>
				)}

				{/* 🔥 TOMBOL LONCENG NOTIFIKASI */}
				<div
					className="relative"
					ref={dropdownRef}>
					<button
						onClick={() => setShowNotifDropdown(!showNotifDropdown)}
						className="relative p-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-black rounded-xl transition-all focus:outline-none shadow-sm">
						<Bell
							size={20}
							className={unreadCount > 0 ? "animate-[ring_2s_ease-in-out_infinite]" : ""}
						/>
						{/* Badge Merah Angka Notif */}
						{unreadCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800">{unreadCount > 99 ? "99+" : unreadCount}</span>
						)}
					</button>

					{/* 🔥 DROPDOWN NOTIFIKASI */}
					{showNotifDropdown && (
						<div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in origin-top-right">
							<div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
								<h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
								{unreadCount > 0 && <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded-md font-bold">{unreadCount} New</span>}
							</div>

							<div className="max-h-[400px] overflow-y-auto">
								{notifications.length === 0 ? (
									<div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
										<Bell
											size={32}
											className="mb-2 opacity-20"
										/>
										<p className="text-sm">You're all caught up!</p>
									</div>
								) : (
									<div className="divide-y divide-gray-50 dark:divide-gray-700/50">
										{notifications.map((notif) => (
											<div
												key={notif.id}
												className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!notif.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
												<div className="flex gap-3">
													<div className="mt-0.5">
														{notif.type === "ANNOUNCEMENT" ? (
															<div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full">
																<Megaphone size={16} />
															</div>
														) : notif.type === "WARNING" ? (
															<div className="p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full">
																<AlertTriangle size={16} />
															</div>
														) : (
															<div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
																<Info size={16} />
															</div>
														)}
													</div>
													<div className="flex-1">
														<h4 className={`text-sm ${!notif.isRead ? "font-bold text-gray-800 dark:text-gray-100" : "font-semibold text-gray-600 dark:text-gray-300"}`}>{notif.title}</h4>
														<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
														<div className="flex justify-between items-center mt-2">
															<span className="text-[10px] text-gray-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
															{!notif.isRead && (
																<button
																	onClick={() => handleMarkAsRead(notif.id)}
																	className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
																	<CheckCircle2 size={12} /> Mark Read
																</button>
															)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* TOMBOL TEMA */}
				<button
					onClick={toggleTheme}
					className="p-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-black rounded-xl transition-all focus:outline-none shadow-sm">
					{theme === "light" ? (
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					) : (
						<svg
							className="w-5 h-5 text-yellow-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					)}
				</button>
			</div>

			{/* 🔥 MODAL BROADCAST (HANYA HR) */}
			{showBroadcastModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md scale-in border border-gray-100 dark:border-gray-700">
						<div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
							<div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
								<Megaphone size={24} />
							</div>
							<div>
								<h2 className="text-xl font-bold text-gray-800 dark:text-white">Global Announcement</h2>
								<p className="text-xs text-gray-500 dark:text-gray-400">Send an instant alert to all employees</p>
							</div>
						</div>

						<form
							onSubmit={handleSendBroadcast}
							className="space-y-4">
							<div>
								<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Subject</label>
								<input
									type="text"
									required
									placeholder="e.g. Server Maintenance"
									value={broadcastForm.title}
									onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
									className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Message Body</label>
								<textarea
									required
									rows={4}
									placeholder="Type your announcement here..."
									value={broadcastForm.message}
									onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
									className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
								<button
									type="button"
									onClick={() => setShowBroadcastModal(false)}
									className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors">
									Cancel
								</button>
								<button
									type="submit"
									disabled={isBroadcasting}
									className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
									{isBroadcasting ? (
										"Sending..."
									) : (
										<>
											<Send size={16} /> Send Now
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* CSS untuk animasi lonceng */}
			<style>{`
				@keyframes ring {
					0% { transform: rotate(0); }
					5% { transform: rotate(15deg); }
					10% { transform: rotate(-15deg); }
					15% { transform: rotate(10deg); }
					20% { transform: rotate(-10deg); }
					25% { transform: rotate(5deg); }
					30% { transform: rotate(-5deg); }
					35% { transform: rotate(0); }
					100% { transform: rotate(0); }
				}
			`}</style>
		</div>
	);
}
