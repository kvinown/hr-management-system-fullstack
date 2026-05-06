import { useState, useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import socket from "../lib/socket"; // 🔥 Import socket dari lib
import api from "../lib/axios";
import { MessageCircle, X, ChevronLeft, Send, User, Search, BellRing, Paperclip, FileText, Download, UploadCloud } from "lucide-react";

export default function FloatingChat() {
	const [isOpen, setIsOpen] = useState(false);
	const [user, setUser] = useState<any>(null);

	const [contacts, setContacts] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedContact, setSelectedContact] = useState<any | null>(null);

	const [messages, setMessages] = useState<any[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [uploading, setUploading] = useState(false);

	const [isDragging, setIsDragging] = useState(false);
	const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dragCounter = useRef(0);

	const selectedContactRef = useRef(selectedContact);
	const contactsRef = useRef(contacts);
	const isOpenRef = useRef(isOpen);

	useEffect(() => {
		selectedContactRef.current = selectedContact;
	}, [selectedContact]);
	useEffect(() => {
		contactsRef.current = contacts;
	}, [contacts]);
	useEffect(() => {
		isOpenRef.current = isOpen;
	}, [isOpen]);

	const fetchContacts = useCallback(() => {
		if (user) {
			api
				.get("/chat/contacts")
				.then((res) => setContacts(res.data.data))
				.catch((err) => console.error(err));
		}
	}, [user]);

	useEffect(() => {
		if (selectedContact) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [selectedContact]);

	// 🔥 MENGGUNAKAN GLOBAL SOCKET
	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			try {
				const decoded: any = jwtDecode(token);
				setUser(decoded);

				// Daftarkan user ke room
				socket.emit("register_user", decoded.id);

				// Listener pesan masuk
				const handleReceiveMessage = (msg: any) => {
					const currentChatId = selectedContactRef.current?.id;

					if (msg.senderId === currentChatId || msg.receiverId === currentChatId) {
						setMessages((prev) => [...prev, msg]);
						scrollToBottom();
					}

					setContacts((prevContacts) => {
						const updated = prevContacts.map((c) => {
							if (c.id === msg.senderId || c.id === msg.receiverId) {
								return {
									...c,
									lastMessage: msg.fileType ? `📁 ${msg.fileName}` : msg.content,
									unreadCount: msg.senderId === c.id && (msg.senderId !== currentChatId || !isOpenRef.current) ? (c.unreadCount || 0) + 1 : c.unreadCount,
								};
							}
							return c;
						});
						return updated.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
					});

					if (msg.senderId !== decoded.id && (msg.senderId !== currentChatId || !isOpenRef.current)) {
						const senderName = contactsRef.current.find((c) => c.id === msg.senderId)?.name || "New Message";
						const displayMsg = msg.fileType ? `📁 Sent an attachment` : msg.content;
						setToast({ title: senderName, message: displayMsg });
						try {
							new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
						} catch (e) {}
						setTimeout(() => setToast(null), 4000);
					}
				};

				socket.on("receive_private_message", handleReceiveMessage);

				// Cleanup listener saat komponen di-unmount
				return () => {
					socket.off("receive_private_message", handleReceiveMessage);
				};
			} catch (err) {}
		}
	}, []);

	useEffect(() => {
		fetchContacts();
	}, [user, fetchContacts]);

	useEffect(() => {
		if (selectedContact) {
			setLoadingHistory(true);
			api
				.get(`/chat/history/${selectedContact.id}`)
				.then((res) => {
					setMessages(res.data.data);
					scrollToBottom();
					setContacts((prev) => prev.map((c) => (c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c)));
				})
				.finally(() => setLoadingHistory(false));
		}
	}, [selectedContact]);

	const scrollToBottom = () => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	};

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounter.current++;
		if (selectedContact) setIsDragging(true);
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounter.current--;
		if (dragCounter.current === 0) setIsDragging(false);
	};
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		dragCounter.current = 0;
		const file = e.dataTransfer.files?.[0];
		if (file) executeFileUpload(file);
	};

	const executeFileUpload = async (file: File) => {
		if (!selectedContact || !user) return;
		setUploading(true);
		const formData = new FormData();
		formData.append("file", file);
		try {
			const res = await api.post("/chat/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
			const { fileUrl, fileName, fileType } = res.data;
			socket.emit("send_private_message", { senderId: user.id, receiverId: selectedContact.id, content: "", fileUrl, fileName, fileType });
		} catch (err) {
			alert("Failed to upload file");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
			scrollToBottom();
		}
	};

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !selectedContact || !user) return;
		socket.emit("send_private_message", { senderId: user.id, receiverId: selectedContact.id, content: newMessage });
		setNewMessage("");
		inputRef.current?.focus();
	};

	const getFileUrl = (path: string) => `http://${window.location.hostname}:5000${path}`;

	if (!user) return null;
	const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
	const filteredContacts = contacts.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
			{toast && !isOpen && (
				<div
					className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-72 animate-slide-up flex gap-3 cursor-pointer"
					onClick={() => setIsOpen(true)}>
					<div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-full h-fit">
						<BellRing
							size={16}
							className="animate-pulse"
						/>
					</div>
					<div className="flex-1 overflow-hidden">
						<h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{toast.title}</h4>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{toast.message}</p>
					</div>
				</div>
			)}

			{!isOpen && (
				<button
					onClick={() => {
						setIsOpen(true);
						fetchContacts();
					}}
					className="relative bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center">
					<MessageCircle size={28} />
					{totalUnread > 0 && (
						<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 animate-bounce">
							{totalUnread > 9 ? "9+" : totalUnread}
						</span>
					)}
				</button>
			)}

			{isOpen && (
				<div
					className="w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in origin-bottom-right relative"
					onDragEnter={handleDragEnter}
					onDragOver={(e) => e.preventDefault()}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}>
					{isDragging && (
						<div className="absolute inset-0 bg-blue-600/90 z-[60] flex flex-col items-center justify-center text-white p-6 text-center animate-pulse pointer-events-none">
							<UploadCloud
								size={64}
								className="mb-4"
							/>
							<p className="text-xl font-bold">Drop to send file</p>
						</div>
					)}
					<div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-md z-10">
						<div className="flex items-center gap-3">
							{selectedContact ? (
								<button
									onClick={() => {
										setSelectedContact(null);
										fetchContacts();
									}}
									className="p-1 hover:bg-blue-700 rounded-full transition">
									<ChevronLeft size={20} />
								</button>
							) : (
								<MessageCircle size={20} />
							)}
							<div>
								<h3 className="font-bold text-sm leading-tight">{selectedContact ? selectedContact.name : "Messages"}</h3>
								{selectedContact && <p className="text-[10px] text-blue-200 uppercase tracking-wider">{selectedContact.role.replace("_", " ")}</p>}
							</div>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="p-1 hover:bg-blue-700 rounded-full transition">
							<X size={20} />
						</button>
					</div>

					{!selectedContact && (
						<div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900/50">
							<div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 relative">
								<Search
									size={16}
									className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400"
								/>
								<input
									type="text"
									placeholder="Search by name..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full bg-gray-100 dark:bg-gray-900 text-sm text-gray-800 dark:text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
							<div className="flex-1 overflow-y-auto p-2">
								{filteredContacts.map((contact) => (
									<button
										key={contact.id}
										onClick={() => setSelectedContact(contact)}
										className="w-full flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors text-left border border-transparent hover:border-gray-100 dark:hover:border-gray-700 hover:shadow-sm mb-1">
										<div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
											<User size={24} />
										</div>
										<div className="flex-1 min-w-0 overflow-hidden">
											<div className="flex justify-between items-center mb-0.5">
												<h4 className="text-sm font-bold text-gray-800 dark:text-white truncate pr-2">{contact.name}</h4>
												<p className="text-[9px] text-gray-400 font-medium uppercase whitespace-nowrap">{contact.role.replace("_", " ")}</p>
											</div>
											<p className={`text-xs truncate ${contact.unreadCount > 0 ? "font-bold text-gray-800 dark:text-gray-200" : "text-gray-500"}`}>{contact.lastMessage ? contact.lastMessage : "Start a conversation"}</p>
										</div>
										{contact.unreadCount > 0 && <div className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex flex-shrink-0 items-center justify-center rounded-full ml-1">{contact.unreadCount}</div>}
									</button>
								))}
							</div>
						</div>
					)}

					{selectedContact && (
						<>
							<div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] dark:bg-gray-900 space-y-3">
								{loadingHistory ? (
									<div className="text-center text-gray-500 text-xs mt-4">Loading messages...</div>
								) : (
									messages.map((msg, idx) => {
										const isMe = msg.senderId === user.id;
										return (
											<div
												key={idx}
												className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
												<div
													className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none"}`}>
													{msg.fileUrl && msg.fileType === "IMAGE" && (
														<a
															href={getFileUrl(msg.fileUrl)}
															target="_blank"
															rel="noopener noreferrer">
															<img
																src={getFileUrl(msg.fileUrl)}
																alt="Attachment"
																className="max-w-full h-auto rounded-lg mb-1 object-cover cursor-pointer hover:opacity-90"
															/>
														</a>
													)}
													{msg.fileUrl && msg.fileType === "DOCUMENT" && (
														<a
															href={getFileUrl(msg.fileUrl)}
															target="_blank"
															rel="noopener noreferrer"
															className={`flex items-center gap-2 p-2 rounded-lg border ${isMe ? "bg-blue-700 border-blue-500 hover:bg-blue-800 text-white" : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"} transition mb-1`}>
															<FileText
																size={24}
																className={isMe ? "text-white" : "text-blue-500"}
															/>
															<span className="truncate text-xs font-semibold flex-1 max-w-[120px]">{msg.fileName}</span>
															<Download size={16} />
														</a>
													)}
													{msg.content && <span>{msg.content}</span>}
												</div>
												<span className="text-[9px] text-gray-400 mt-1 px-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
											</div>
										);
									})
								)}
								{uploading && <div className="text-center text-xs text-gray-400 animate-pulse">Uploading file...</div>}
								<div ref={messagesEndRef} />
							</div>
							<div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
								<form
									onSubmit={handleSendMessage}
									className="flex items-center gap-2">
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) executeFileUpload(file);
										}}
										accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
									/>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 transition">
										<Paperclip size={20} />
									</button>
									<input
										ref={inputRef}
										type="text"
										placeholder="Type a message..."
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<button
										type="submit"
										disabled={!newMessage.trim()}
										className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:hover:bg-blue-600">
										<Send size={18} />
									</button>
								</form>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
