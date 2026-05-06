import axios from "axios";

// 🔥 DETEKSI BASE URL DINAMIS
// Jika kita buka dari HP (lewat IP), maka API juga harus nembak ke IP Laptop tersebut.
const getBaseURL = () => {
	// Jika ada environment variable dari Railway, gunakan itu
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}

	// Jika tidak ada (sedang di lokal), gunakan logika IP/Hostname kamu
	const host = window.location.hostname;
	return `http://${host}:5000/api`;
};

const api = axios.create({
	baseURL: getBaseURL(), // 🔥 Otomatis menyesuaikan dengan Network atau Local
});

//////////////////////////////
// REQUEST INTERCEPTOR
//////////////////////////////
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

//////////////////////////////
// RESPONSE INTERCEPTOR (REFRESH TOKEN)
//////////////////////////////
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers["Authorization"] = "Bearer " + token;
						return api(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = localStorage.getItem("refreshToken");

			try {
				const res = await axios.post(`${getBaseURL()}/api/auth/refresh`, {
					refreshToken,
				});

				const newAccessToken = res.data.accessToken;

				localStorage.setItem("accessToken", newAccessToken);

				api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;

				processQueue(null, newAccessToken);

				return api(originalRequest);
			} catch (err) {
				processQueue(err, null);

				// ❌ logout kalau refresh gagal
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");

				window.location.href = "/login";

				return Promise.reject(err);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	},
);

//////////////////////////////
// ATTENDANCE API CALLS
//////////////////////////////
export const clockIn = async (data: { lat: number; lng: number; photo?: string }) => {
	return api.post("/attendance/clock-in", data);
};

export const clockOut = async (data: { lat: number; lng: number; photo?: string }) => {
	return api.post("/attendance/clock-out", data);
};

export default api;
