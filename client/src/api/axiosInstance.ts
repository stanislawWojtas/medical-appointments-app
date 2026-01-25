import axios from "axios"

const BASE_URL = 'http://localhost:3000'

export const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json"
	}
})

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

// Interceptor - obsługa błędów autoryzacji
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token wygasł lub jest nieprawidłowy
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			window.location.href = '/login';
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
		BASE: '/api/appointments'
	}
}