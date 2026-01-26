import { Box, Flex } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import DoctorSidebar from "../components/DoctorSidebar";
import PatientSideBar from "../components/PatientSideBar";



const MainLayout = () => {
	const { user, isAuthenticated } = useAuth();

	// Określ, czy wyświetlać sidebar i jaki typ
	const showSidebar = isAuthenticated && user;
	const isDoctor = user?.role === 'DOCTOR';

	return(
		<>
			<Box h={'100dvh'} fontFamily={"sans-serif"}>
				<Navbar />
				<Flex h={"calc(100% - 72px)"}>
					{showSidebar && (
						<Box flex={1}>
							{isDoctor ? <DoctorSidebar /> : <PatientSideBar />}
						</Box>
					)}
					<Box flex={showSidebar ? 5 : 1} bg={showSidebar ? 'gray.200' : 'white'}>
						<Outlet />
					</Box>
				</Flex>
				<Footer />
			</Box>
		</>
	)
};

export default MainLayout;