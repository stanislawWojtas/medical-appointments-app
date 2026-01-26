import { Box, Heading, Stack, Text, Button, Flex, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Doctor } from "../models/Doctor";
import { useAuth } from "../context/AuthContext";
import * as consultationService from "../services/consultationService";

const HomePage = () => {
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSpecialization, setSelectedSpecialization] = useState<string>("ALL");
	const navigate = useNavigate();
	const { isAuthenticated, user } = useAuth();

	useEffect(() => {
		const fetchDoctors = async () => {
			try {
				const doctors = await consultationService.getDoctors();
				setDoctors(doctors);
				setFilteredDoctors(doctors);
			} catch (error) {
				console.error("Error fetching doctors:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDoctors();
	}, []);

	// Filtrowanie i wyszukiwanie
	useEffect(() => {
		let result = doctors;

		if (selectedSpecialization !== "ALL") {
			result = result.filter(doc => doc.specialization === selectedSpecialization);
		}

		if (searchQuery) {
			result = result.filter(doc => 
				`${doc.firstName} ${doc.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		setFilteredDoctors(result);
	}, [searchQuery, selectedSpecialization, doctors]);

	const specializations = Array.from(new Set(doctors.map(d => d.specialization)));

	return (
		<Box p={6}>
			<Heading mb={6}>Available Doctors</Heading>
			
			<Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
				<Stack gap={4}>
					<Box>
						<Text mb={2} fontWeight="bold">Search by name:</Text>
						<Input
							placeholder="Enter doctor's name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							bg="white"
						/>
					</Box>
					
					<Box>
						<Text mb={2} fontWeight="bold">Filter by specialization:</Text>
						<select
							value={selectedSpecialization}
							onChange={(e) => setSelectedSpecialization(e.target.value)}
							style={{
								width: '100%',
								padding: '8px 12px',
								borderRadius: '6px',
								border: '1px solid #E2E8F0',
								backgroundColor: 'white',
								fontSize: '16px'
							}}
						>
							<option value="ALL">All Specializations</option>
							{specializations.map(spec => (
								<option key={spec} value={spec}>{spec}</option>
							))}
						</select>
					</Box>
				</Stack>
			</Box>

			{isLoading ? (
				<Text>Loading doctors...</Text>
			) : (
				<Stack gap={4}>
					{filteredDoctors.map((doctor) => (
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
							{isAuthenticated && user?.role === 'PATIENT' ? (
								<Button
									colorPalette="blue"
									onClick={() => navigate(`/booking/doctor/${doctor.id}`)}
								>
									Book Appointment
								</Button>
							) : !isAuthenticated ? (
								<Button
									colorPalette="blue"
									variant="outline"
									onClick={() => navigate('/login')}
								>
									Login to Book
								</Button>
							) : null}
							</Flex>
						</Box>
					))}
					
					{filteredDoctors.length === 0 && !isLoading && (
						<Text>No doctors found matching your criteria.</Text>
					)}
				</Stack>
			)}
		</Box>
	);
};

export default HomePage;