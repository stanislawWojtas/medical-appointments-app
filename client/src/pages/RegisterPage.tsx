import { useState } from 'react';
import { api, ENDPOINTS } from '../api/axiosInstance';
import { Box, Button, Input, Stack, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';

export const RegisterPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [specialization, setSpecialization] = useState('');
	const [pricePerVisit, setPricePerVisit] = useState('');
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
			const payload: any = {
				email,
				password,
				role
			};

			// Jeśli rejestrujemy lekarza, dodaj dodatkowe pola
			if (role === 'DOCTOR') {
				payload.firstname = firstname;
				payload.lastname = lastname;
				payload.specialization = specialization;
				if (pricePerVisit) {
					payload.pricePerVisit = Number(pricePerVisit);
				}
			}

			await api.post(ENDPOINTS.AUTH.REGISTER, payload);
			
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
			<Heading mb="6">Register</Heading>
			
			<form onSubmit={handleRegister}>
				<Stack gap="4">
					<select 
						value={role} 
						onChange={(e) => setRole(e.target.value as 'PATIENT' | 'DOCTOR')}
						style={{
							padding: '8px 12px',
							borderRadius: '6px',
							border: '1px solid #E2E8F0',
							fontSize: '16px'
						}}
					>
						<option value="PATIENT">Patient</option>
						<option value="DOCTOR">Doctor</option>
					</select>

					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Input
						type="password"
						placeholder="Password (min. 6 characters)"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>

					{role === 'DOCTOR' && (
						<>
							<Input
								placeholder="First Name"
								value={firstname}
								onChange={(e) => setFirstname(e.target.value)}
								required
							/>
							<Input
								placeholder="Last Name"
								value={lastname}
								onChange={(e) => setLastname(e.target.value)}
								required
							/>
							<Input
								placeholder="Specialization"
								value={specialization}
								onChange={(e) => setSpecialization(e.target.value)}
								required
							/>
							<Input
								type="number"
								placeholder="Price per visit (optional, default 150)"
								value={pricePerVisit}
								onChange={(e) => setPricePerVisit(e.target.value)}
							/>
						</>
					)}
					
					{error && <Text color="red.500">{error}</Text>}
					{success && <Text color="green.500">{success}</Text>}
					
					<Button type="submit" colorPalette="blue" isLoading={isLoading}>
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
