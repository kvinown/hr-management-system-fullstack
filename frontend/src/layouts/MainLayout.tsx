import { ReactNode, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import FloatingChat from "../components/FloatingChat"; // 🔥 1. Import komponen chat
import { useTheme } from "../hooks/useTheme";

type Props = {
	children: ReactNode;
};

export default function MainLayout({ children }: Props) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const { theme, toggleTheme } = useTheme();

	return (
		<div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 overflow-hidden relative">
			{/* OVERLAY MOBILE */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* SIDEBAR */}
			<div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
				<Sidebar onClose={() => setIsSidebarOpen(false)} />
			</div>

			<div className="flex-1 flex flex-col h-screen overflow-hidden">
				{/* NAVBAR */}
				<Navbar
					onOpenMenu={() => setIsSidebarOpen(true)}
					theme={theme}
					toggleTheme={toggleTheme}
				/>

				{/* PAGE CONTENT */}
				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 text-gray-800 dark:text-gray-200">{children}</main>
			</div>

			{/* 🔥 2. Letakkan Floating Chat di sini agar melayang di atas semua konten */}
			<FloatingChat />
		</div>
	);
}
