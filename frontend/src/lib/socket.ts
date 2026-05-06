import { io, Socket } from "socket.io-client";

const getSocketURL = () => {
	// Jika sudah di-hosting (Railway), gunakan URL dari Environment Variable
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL.replace("/api", "");
	}
	// Jika di lokal (laptop/HP), gunakan IP host
	return `http://${window.location.hostname}:5000`;
};

// Buat instance socket tunggal (Singleton)
const socket: Socket = io(getSocketURL(), {
	transports: ["websocket"], // Paksa websocket agar stabil di Railway
	secure: !!import.meta.env.VITE_API_URL, // Gunakan WSS/HTTPS jika di Railway
});

export default socket;
