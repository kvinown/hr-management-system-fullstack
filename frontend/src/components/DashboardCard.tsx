interface DashboardCardProps {
	title: string;
	value: string | number;
}

export default function DashboardCard({ title, value }: DashboardCardProps) {
	return (
		<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 transition-colors duration-300">
			<h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{title}</h3>
			<p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
		</div>
	);
}
