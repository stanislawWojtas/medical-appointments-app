import axios from "axios"

const BASE_URL = 'http://localhost:3000'

export const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json"
	}
})

// Kolejka dla zapytań, które czekają na odświeżenie tokena
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: any) => void;
	reject: (error?: any) => void;
}> = [];

// obsługa kolejki
const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	});

	failedQueue = [];
};

// Interceptor - automatycznie dodaje token do każdego requesta
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Interceptor - obsługa błędów autoryzacji z odświeżaniem tokena
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
			
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then((token) => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
					return api(originalRequest);
				}).catch((err) => {
					return Promise.reject(err);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = localStorage.getItem('refreshToken');
			if (!refreshToken) {
				// wylogowanie jeśli nie ma user refresh tokena
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
				localStorage.removeItem('user');
				window.location.href = '/login';
				return Promise.reject(error);
			}

			try {
				// odswiezenie tokena
				const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
					refreshToken
				});

				const { accessToken } = response.data;
				localStorage.setItem('token', accessToken);

				api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

				processQueue(null, accessToken);

				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
				localStorage.removeItem('user');
				window.location.href = '/login';
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

export const ENDPOINTS = {
	AUTH: {
		LOGIN: '/api/auth/login',
		REGISTER: '/api/auth/register'
	},
	DOCTORS: {
		LIST: '/api/doctors',
		BASE: '/api/doctors'
	},
	ABSENCES: {
		BASE: '/api/absences'
	},
	APPOINTMENTS: {
		LIST: '/api/appointments',
		BASE: '/api/appointments',
		MY_APPOINTMENTS: '/api/appointments/my-appointments',
		CANCEL_BY_PATIENT: (id: string) => `/api/appointments/${id}/cancel-by-patient`
	},
	REVIEWS: {
		CREATE: '/api/reviews',
		BY_DOCTOR: (doctorId: string) => `/api/reviews/doctor/${doctorId}`,
		STATS: (doctorId: string) => `/api/reviews/doctor/${doctorId}/stats`
	}
}