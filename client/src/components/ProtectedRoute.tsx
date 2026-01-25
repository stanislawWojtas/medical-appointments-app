import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
	children: ReactNode;
	allowedRoles?: ('DOCTOR' | 'PATIENT' | 'ADMIN')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
	const { isAuthenticated, user } = useAuth();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles && user && !allowedRoles.includes(user.role)) {
		return <Navigate to="/unauthorized" replace />;
	}

	return <>{children}</>;
};
