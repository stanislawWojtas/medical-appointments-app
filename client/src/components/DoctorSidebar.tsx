import { Box, Button, Flex, Image, Text, Spinner } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getDoctorById } from "../services/consultationService";
import type { Doctor } from "../models/Doctor";

const DoctorSidebar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();
	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchDoctorData = async () => {
			if (user?.doctorId) {
				try {
					const doctorData = await getDoctorById(user.doctorId);
					if (doctorData) {
						setDoctor(doctorData);
					}
				} catch (error) {
					console.error("Error fetching doctor data:", error);
				} finally {
					setIsLoading(false);
				}
			}
		};
		fetchDoctorData();
	}, [user?.doctorId]);

	const isActive = (path: string) => location.pathname === path;

	return (
		<>
			<Flex flexDirection={"column"} gap={2} p={3} alignItems={"center"} boxShadow={'md'} h={'100%'}>
				<Box
					border={'4px solid black'}
					borderRadius={'50%'}
					overflow={'hidden'}
					w={40}
					h={40}>
					<Image
						objectFit={"cover"}
						w={'100%'}
						h={'100%'}
						alt="Doctor Image" 
						src="https://img.icons8.com/color/1200/medical-doctor.jpg" />
				</Box>
				{isLoading ? (
					<Spinner size="sm" />
				) : doctor ? (
					<>
						<Text fontWeight={"bold"}>Dr. {doctor.firstName} {doctor.lastName}</Text>
						<Text color={'gray.500'}>{doctor.specialization}</Text>
					</>
				) : (
					<Text color={'gray.500'}>Loading...</Text>
				)}
				
				<Box w="100%" mt={4} borderTop="1px solid" borderColor="gray.200" pt={4}>
					<Button
						w="100%"
						variant={isActive('/doctor/dashboard') ? 'solid' : 'ghost'}
						colorPalette="blue"
						onClick={() => navigate('/doctor/dashboard')}
						mb={2}
					>
						Dashboard
					</Button>
					<Button
						w="100%"
						variant={isActive('/doctor/reviews') ? 'solid' : 'ghost'}
						colorPalette="blue"
						onClick={() => navigate('/doctor/reviews')}
					>
						Reviews
					</Button>
				</Box>
			</Flex>
		</>
	)
}

export default DoctorSidebar;