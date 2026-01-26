import { Box, Heading, Stack, Text, Button, Flex, Badge, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Patient } from "../services/IDataProvider";
import * as consultationService from "../services/consultationService";

const AdminPatients = () => {
	const [patients, setPatients] = useState<Patient[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const fetchPatients = async () => {
		try {
			const data = await consultationService.getAllPatients();
			setPatients(data);
		} catch (error) {
			setError((error as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPatients();
	}, []);

	const handleBlockUser = async (userId: string) => {
		try {
			await consultationService.blockUser(userId);
			setSuccess('User blocked successfully');
			setError('');
			fetchPatients();
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			setError(err.response?.data?.message || (error as Error).message);
			setSuccess('');
		}
	};

	const handleUnblockUser = async (userId: string) => {
		try {
			await consultationService.unblockUser(userId);
			setSuccess('User unblocked successfully');
			setError('');
			fetchPatients();
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			setError(err.response?.data?.message || (error as Error).message);
			setSuccess('');
		}
	};

	return (
		<Box p={6}>
			<Heading mb={6}>Patients Management</Heading>

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
				{isLoading ? (
					<Flex justify="center" p={4}>
						<Spinner size="lg" />
					</Flex>
				) : patients.length === 0 ? (
					<Text>No patients found.</Text>
				) : (
					<Stack gap={3}>
						{patients.map((patient) => (
							<Flex
								key={patient.id}
								p={4}
								borderWidth="1px"
								borderRadius="md"
								justify="space-between"
								align="center"
								bg={patient.isBlocked ? "red.50" : "white"}
							>
								<Box>
									<Text fontWeight="bold">{patient.email}</Text>
									<Text fontSize="sm" color="gray.600">
										Registered: {new Date(patient.createdAt).toLocaleDateString()}
									</Text>
								</Box>
								<Flex gap={2} align="center">
									{patient.isBlocked && (
										<Badge colorScheme="red">Blocked</Badge>
									)}
									{patient.isBlocked ? (
										<Button
											size="sm"
											colorPalette="green"
											onClick={() => handleUnblockUser(patient.id)}
										>
											Unblock
										</Button>
									) : (
										<Button
											size="sm"
											colorPalette="red"
											onClick={() => handleBlockUser(patient.id)}
										>
											Block
										</Button>
									)}
								</Flex>
							</Flex>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default AdminPatients;
