import { useState, useEffect } from "react";

export function useTheme() {
	const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

	useEffect(() => {
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);

	// 🔥 Suntikkan CSS khusus View Transitions secara dinamis ke head HTML
	useEffect(() => {
		if (!document.getElementById("view-transition-styles")) {
			const style = document.createElement("style");
			style.id = "view-transition-styles";
			style.innerHTML = `
				::view-transition-old(root),
				::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
				::view-transition-old(root) { z-index: var(--z-old, 1); }
				::view-transition-new(root) { z-index: var(--z-new, 9999); }
			`;
			document.head.appendChild(style);
		}
	}, []);

	const toggleTheme = (e: React.MouseEvent) => {
		const nextTheme = theme === "light" ? "dark" : "light";
		const isGoingDark = nextTheme === "dark";

		if (!document.startViewTransition) {
			setTheme(nextTheme);
			return;
		}

		const x = e.clientX;
		const y = e.clientY;
		const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

		document.documentElement.style.setProperty("--z-old", isGoingDark ? "9999" : "1");
		document.documentElement.style.setProperty("--z-new", isGoingDark ? "1" : "9999");

		const transition = document.startViewTransition(() => {
			setTheme(nextTheme);
		});

		transition.ready.then(() => {
			const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

			(document.documentElement.animate as any)(
				{
					clipPath: isGoingDark ? [...clipPath].reverse() : clipPath,
				},
				{
					duration: 500,
					easing: "ease-in-out",
					pseudoElement: isGoingDark ? "::view-transition-old(root)" : "::view-transition-new(root)",
				},
			);
		});
	};

	return { theme, toggleTheme };
}
