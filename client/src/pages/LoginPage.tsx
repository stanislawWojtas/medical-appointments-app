import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Input, Stack, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import * as consultationService from '../services/consultationService';

export const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const { token, user } = await consultationService.login(email, password);
			
			// Zapisujemy token i dane użytkownika
			login(token, user);
			
			// Przekierowanie w zależności od roli
			if (user.role === 'DOCTOR') {
				navigate('/doctor-dashboard');
			} else if (user.role === 'PATIENT') {
				navigate('/home');
			} else {
				navigate('/');
			}
		} catch (err: any) {
			setError(err.response?.data?.message || 'Login error');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box maxW="400px" mx="auto" mt="100px" p="6" borderWidth="1px" borderRadius="lg">
			<Heading mb="6">Login</Heading>
			
			<form onSubmit={handleLogin}>
				<Stack gap="4">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					
					{error && <Text color="red.500">{error}</Text>}
					
					<Button type="submit" colorPalette="blue">
						Login
					</Button>

					<Button variant="ghost" onClick={() => navigate('/register')}>
						Don't have an account? Register
					</Button>
				</Stack>
			</form>
		</Box>
	);
};
