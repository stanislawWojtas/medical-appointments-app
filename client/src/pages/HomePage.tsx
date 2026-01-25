import { Box, Heading, Stack, Text, Button, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, ENDPOINTS } from "../api/axiosInstance";
import type { Doctor } from "../models/Doctor";

const HomePage = () => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchDoctors = async () => {
			try {
				const response = await api.get(ENDPOINTS.DOCTORS.LIST);
				setDoctors(response.data);
			} catch (error) {
				console.error("Error fetching doctors:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDoctors();
	}, []);

	return (
		<Box p={6}>
			<Heading mb={6}>Available Doctors</Heading>
			
			{isLoading ? (
				<Text>Loading doctors...</Text>
			) : (
				<Stack gap={4}>
					{doctors.map((doctor) => (
						<Box
							key={doctor.id}
							p={4}
							borderWidth="1px"
							borderRadius="lg"
							bg="white"
							_hover={{ shadow: "md" }}
						>
							<Flex justify="space-between" align="center">
								<Box>
									<Heading size="md">
										Dr. {doctor.firstName} {doctor.lastName}
									</Heading>
									<Text color="gray.600">{doctor.specialization}</Text>
									<Text color="blue.600" fontWeight="bold">
										${doctor.pricePerVisit} per visit
									</Text>
								</Box>
								<Button
									colorScheme="blue"
									onClick={() => navigate(`/booking/doctor/${doctor.id}`)}
								>
									Book Appointment
								</Button>
							</Flex>
						</Box>
					))}
					
					{doctors.length === 0 && !isLoading && (
						<Text>No doctors available at the moment.</Text>
					)}
				</Stack>
			)}
		</Box>
	);
};

export default HomePage;