import axios from "axios"


const BASE_URL = 'http://localhost:3000'

export const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json"
	}
})

export const ENDPOINTS = {
	DOCTORS: {
		LIST: '/doctors',
		BASE: '/doctors'
	},
	ABSENCES: {
		BASE: '/absences'
	},
	APPOINTMENTS: {
		LIST: '/appointments',
		BASE: '/appointments'
	}
}