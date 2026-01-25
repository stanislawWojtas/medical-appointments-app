import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
	id: string;
	email: string;
	role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
	doctorId?: string; // Jeśli jest lekarzem
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (token: string, userData: User) => void;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {

		const storedToken = localStorage.getItem('token');
		const storedUser = localStorage.getItem('user');

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}
	}, []);

	const login = (newToken: string, userData: User) => {
		setToken(newToken);
		setUser(userData);
		localStorage.setItem('token', newToken);
		localStorage.setItem('user', JSON.stringify(userData));
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login'; 
	};

	return (
		<AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};