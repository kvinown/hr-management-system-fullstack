import { prisma } from "../../lib/prisma";

export class ChatService {
	// Ambil daftar kontak (Semua orang) beserta Last Message & Unread Count
	static async getContacts(userId: string) {
		const contacts = await prisma.user.findMany({
			where: { id: { not: userId } }, // Tampilkan semua kecuali diri sendiri
			select: { id: true, name: true, role: true },
		});

		// Cari pesan terakhir & jumlah unread untuk setiap kontak
		const enrichedContacts = await Promise.all(
			contacts.map(async (contact) => {
				const lastMessage = await prisma.message.findFirst({
					where: {
						OR: [
							{ senderId: userId, receiverId: contact.id },
							{ senderId: contact.id, receiverId: userId },
						],
					},
					orderBy: { createdAt: "desc" },
				});

				console.log(`Last message with ${contact.name}:`, lastMessage);

				const unreadCount = await prisma.message.count({
					where: {
						senderId: contact.id,
						receiverId: userId,
						isRead: false,
					},
				});

				return {
					...contact,
					lastMessage: lastMessage ? lastMessage.content : null,
					lastMessageTime: lastMessage ? lastMessage.createdAt : null,
					unreadCount,
				};
			}),
		);

		// Urutkan kontak: Yang pesannya paling baru ada di atas
		return enrichedContacts.sort((a, b) => {
			if (!a.lastMessageTime) return 1;
			if (!b.lastMessageTime) return -1;
			return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
		});
	}

	static async getChatHistory(user1Id: string, user2Id: string) {
		// Saat membuka chat history, otomatis tandai pesan dari orang tersebut sudah DIBACA
		await prisma.message.updateMany({
			where: { senderId: user2Id, receiverId: user1Id, isRead: false },
			data: { isRead: true },
		});

		return prisma.message.findMany({
			where: {
				OR: [
					{ senderId: user1Id, receiverId: user2Id },
					{ senderId: user2Id, receiverId: user1Id },
				],
			},
			orderBy: { createdAt: "asc" },
		});
	}

	static async saveMessage(data: { senderId: string; receiverId: string; content?: string; fileUrl?: string; fileName?: string; fileType?: string }) {
		return prisma.message.create({
			data: {
				sender: { connect: { id: data.senderId } },
				receiver: { connect: { id: data.receiverId } },

				// 🔥 PERBAIKAN: Gunakan string kosong "", jangan null
				content: data.content || "",

				fileUrl: data.fileUrl || null,
				fileName: data.fileName || null,
				fileType: data.fileType || null,
			},
		});
	}
}
