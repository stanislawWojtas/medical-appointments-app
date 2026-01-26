import { Box, Heading, Stack, Text, Button, Input, Flex } from "@chakra-ui/react";
import { useState } from "react";
import type { RegisterDoctorPayload } from "../services/IDataProvider";
import * as consultationService from "../services/consultationService";

const SPECIALIZATIONS = [
	"GENERAL",
	"CARDIOLOGIST",
	"DERMATOLOGIST",
	"ENDOCRINOLOGIST",
	"NEUROLOGIST",
	"OPHTHALMOLOGIST",
	"ORTHOPEDIST",
	"PEDIATRICIAN",
	"PSYCHIATRIST",
	"LARYNGOLOGIST"
];

const AdminRegisterDoctor = () => {
	const [isRegistering, setIsRegistering] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const [doctorForm, setDoctorForm] = useState<RegisterDoctorPayload>({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		specialization: "",
		pricePerVisit: 150
	});

	const handleRegisterDoctor = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsRegistering(true);
		setError('');
		setSuccess('');

		try {
			await consultationService.registerDoctor(doctorForm);
			setSuccess('Doctor registered successfully');
			setDoctorForm({
				email: "",
				password: "",
				firstName: "",
				lastName: "",
				specialization: "",
				pricePerVisit: 150
			});
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			setError(err.response?.data?.message || (error as Error).message);
		} finally {
			setIsRegistering(false);
		}
	};

	return (
		<Box p={6}>
			<Heading mb={6}>Register New Doctor</Heading>

			{error && (
				<Box p={4} mb={4} bg="red.100" borderRadius="md" color="red.800">
					{error}
				</Box>
			)}
			{success && (
				<Box p={4} mb={4} bg="green.100" borderRadius="md" color="green.800">
					{success}
				</Box>
			)}

			<Box p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
				<form onSubmit={handleRegisterDoctor}>
					<Stack gap={4}>
						<Flex gap={4}>
							<Box flex={1}>
								<Text mb={2} fontWeight="bold">First Name *</Text>
								<Input
									value={doctorForm.firstName}
									onChange={(e) => setDoctorForm({ ...doctorForm, firstName: e.target.value })}
									placeholder="John"
									required
								/>
							</Box>
							<Box flex={1}>
								<Text mb={2} fontWeight="bold">Last Name *</Text>
								<Input
									value={doctorForm.lastName}
									onChange={(e) => setDoctorForm({ ...doctorForm, lastName: e.target.value })}
									placeholder="Doe"
									required
								/>
							</Box>
						</Flex>

						<Box>
							<Text mb={2} fontWeight="bold">Email *</Text>
							<Input
								type="email"
								value={doctorForm.email}
								onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
								placeholder="doctor@example.com"
								required
							/>
						</Box>

						<Box>
							<Text mb={2} fontWeight="bold">Password *</Text>
							<Input
								type="password"
								value={doctorForm.password}
								onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
								placeholder="Min. 8 characters"
								minLength={8}
								required
							/>
						</Box>

						<Flex gap={4}>
							<Box flex={1}>
								<Text mb={2} fontWeight="bold">Specialization *</Text>
								<Box
									as="select"
									value={doctorForm.specialization}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
									required
									px={4}
									py={2}
									borderWidth="1px"
									borderRadius="md"
									borderColor="gray.300"
									bg="white"
									fontSize="md"
									cursor="pointer"
									_hover={{ borderColor: "gray.400" }}
									_focus={{ borderColor: "blue.500", outline: "none", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
								>
									<option value="" disabled>Select specialization</option>
									{SPECIALIZATIONS.map((spec) => (
										<option key={spec} value={spec}>
											{spec}
										</option>
									))}
								</Box>
							</Box>
							<Box flex={1}>
								<Text mb={2} fontWeight="bold">Price Per Visit</Text>
								<Input
									type="number"
									value={doctorForm.pricePerVisit}
									onChange={(e) => setDoctorForm({ ...doctorForm, pricePerVisit: Number(e.target.value) })}
									placeholder="150"
								/>
							</Box>
						</Flex>

						<Button
							type="submit"
							colorPalette="blue"
							loading={isRegistering}
						>
							{isRegistering ? 'Registering...' : 'Register Doctor'}
						</Button>
					</Stack>
				</form>
			</Box>
		</Box>
	);
};

export default AdminRegisterDoctor;
