import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
	id: string;
	email: string;
	role: string;
	exp: number;
};

// 🔥 Tambahkan props theme dan toggleTheme
type NavbarProps = {
	onOpenMenu: () => void;
	theme: string;
	toggleTheme: (e: React.MouseEvent) => void;
};

export default function Navbar({ onOpenMenu, theme, toggleTheme }: NavbarProps) {
	const [user, setUser] = useState<DecodedToken | null>(null);

	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				const decoded: DecodedToken = jwtDecode(token);
				setUser(decoded);
			} catch (err) {
				console.error("Invalid token");
			}
		}
	}, []);

	return (
		<div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-4 md:px-6 transition-colors duration-300 flex-shrink-0">
			<div className="flex items-center gap-3">
				{/* TOMBOL HAMBURGER */}
				<button
					onClick={onOpenMenu}
					className="md:hidden text-gray-600 dark:text-gray-300 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors">
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
				<h2 className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block tracking-wide">PT Sejahtera Amin</h2>
			</div>

			<div className="flex items-center gap-3 sm:gap-5">
				<span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
					Hi, <span className="font-bold">{user?.name || "User"}</span>
				</span>

				<div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

				{/* 🔥 TOMBOL TOGGLE TEMA (Hanya Ikon) */}
				<button
					onClick={toggleTheme}
					className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
					title="Toggle Theme">
					{theme === "light" ? (
						// Ikon Bulan (Untuk pindah ke Dark Mode)
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					) : (
						// Ikon Matahari (Untuk pindah ke Light Mode)
						<svg
							className="w-6 h-6 text-yellow-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					)}
				</button>
			</div>
		</div>
	);
}
