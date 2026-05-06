import express from "express";
import http from "http"; // 🔥 Import http bawaan Node.js
import app from "./app"; // Atau letak konfigurasi express kamu
import { initSocket } from "./lib/socket";

const PORT = process.env.PORT || 5000;

// 🔥 Bungkus express dengan http server
const server = http.createServer(app);

// 🔥 Inisialisasi Socket.io
initSocket(server);

// 🔥 Gunakan server.listen, BUKAN app.listen
server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📡 WebSocket server is active`);
});
