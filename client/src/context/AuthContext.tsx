import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
	id: string;
	email: string;
	role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
	doctorId?: string; // Jeśli jest lekarzem
	firstName?: string; // Imię lekarza
	lastName?: string; // Nazwisko lekarza
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	refreshToken: string | null;
	login: (accessToken: string, refreshToken: string, userData: User) => void;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem('token');
		const storedRefreshToken = localStorage.getItem('refreshToken');
		const storedUser = localStorage.getItem('user');

		if (storedToken && storedUser) {
			setToken(storedToken);
			setRefreshToken(storedRefreshToken);
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const login = (newAccessToken: string, newRefreshToken: string, userData: User) => {
		setToken(newAccessToken);
		setRefreshToken(newRefreshToken);
		setUser(userData);
		localStorage.setItem('token', newAccessToken);
		localStorage.setItem('refreshToken', newRefreshToken);
		localStorage.setItem('user', JSON.stringify(userData));
	};

	const logout = async () => {
		try {
			const refreshToken = localStorage.getItem('refreshToken');
			if (refreshToken) {
				await fetch('http://localhost:3000/api/auth/logout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken })
				});
			}
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			setToken(null);
			setRefreshToken(null);
			setUser(null);
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('user');
		}
	};

	return (
		<AuthContext.Provider value={{ user, token, refreshToken, login, logout, isAuthenticated: !!user, isLoading }}>
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