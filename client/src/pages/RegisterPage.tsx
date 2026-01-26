import { useState } from 'react';
import { Box, Button, Input, Stack, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import * as consultationService from '../services/consultationService';

export const RegisterPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	
	const navigate = useNavigate();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setIsLoading(true);

		try {
			await consultationService.register({
				email,
				password,
				role: 'PATIENT'
			});
			
			setSuccess('Account created! Redirecting to login...');
			setTimeout(() => {
				navigate('/login');
			}, 2000);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Registration error');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box maxW="500px" mx="auto" mt="50px" p="6" borderWidth="1px" borderRadius="lg">
			<Heading mb="6">Register as Patient</Heading>
			
			<form onSubmit={handleRegister}>
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
						placeholder="Password (min. 8 characters)"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={6}
					/>
					
					{error && <Text color="red.500">{error}</Text>}
					{success && <Text color="green.500">{success}</Text>}
					
					<Button type="submit" colorPalette="blue" loading={isLoading}>
						Register
					</Button>

					<Button variant="ghost" onClick={() => navigate('/login')}>
						Already have an account? Login
					</Button>
				</Stack>
			</form>
		</Box>
	);
};
