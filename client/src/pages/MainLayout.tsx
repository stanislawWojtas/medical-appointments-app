import { Box } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router";
import Footer from "../components/Footer";



const MainLayout = () => {

	return(
		<>
			<Box h={'100dvh'} fontFamily={"sans-serif"}>
				<Navbar />
				<Outlet />
				<Footer />
			</Box>
		</>
	)
};

export default MainLayout;