import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { ChatService } from "../modules/chat/chat.service";

let io: Server;

export const initSocket = (server: HttpServer) => {
	io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});

	io.on("connection", (socket: Socket) => {
		console.log(`🔌 Client connected: ${socket.id}`);

		// 1. User Mendaftarkan Diri
		socket.on("register_user", (userId: string) => {
			socket.join(userId);
			console.log(`👤 User ${userId} joined their personal room`);
		});

		// 2. Mendengarkan Pesan Chat Privat
		socket.on("send_private_message", async (data) => {
			try {
				// 🔥 KUNCI PERBAIKANNYA DI SINI:
				// Kita melempar variabel 'data' secara utuh sebagai satu object ke dalam service.
				const savedMessage = await ChatService.saveMessage(data);

				// Kirim pesan ke penerima dan pengirim
				io.to(data.receiverId).emit("receive_private_message", savedMessage);
				io.to(data.senderId).emit("receive_private_message", savedMessage);
			} catch (err) {
				console.error("Failed to save/send message", err);
			}
		});

		socket.on("disconnect", () => {
			console.log(`❌ Client disconnected: ${socket.id}`);
		});
	});

	return io;
};

export const getIO = () => {
	if (!io) {
		throw new Error("Socket.io not initialized!");
	}
	return io;
};
