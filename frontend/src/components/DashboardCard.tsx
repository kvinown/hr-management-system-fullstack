import React from "react";

interface DashboardCardProps {
	title: string;
	value: string | number;
	icon?: React.ReactNode;
	trend?: string;
	trendUp?: boolean;
}

export default function DashboardCard({ title, value, icon, trend, trendUp }: DashboardCardProps) {
	return (
		<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all duration-300">
			{/* Efek gradient tipis di background saat di-hover */}
			<div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 dark:bg-gray-700/50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

			<div className="flex justify-between items-start relative z-10">
				<div>
					<h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">{title}</h3>
					<p className="text-3xl font-extrabold text-gray-800 dark:text-white">{value}</p>

					{trend && (
						<p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trendUp ? "text-green-500" : "text-red-500"}`}>
							<span>{trendUp ? "↑" : "↓"}</span> {trend}
						</p>
					)}
				</div>
				{icon && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">{icon}</div>}
			</div>
		</div>
	);
}
