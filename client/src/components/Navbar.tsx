import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
	const navigate = useNavigate();
	const { isAuthenticated, user, logout } = useAuth();

	return (
		<>
			<Flex
				h="72px"
				align="center"
				bg="blue.400"
				justify="space-between"
				px={3}
			>
				<Text
					fontSize="xx-large"
					color="white"
					fontWeight="bold"
					letterSpacing={3}
				>
					Medical Panel
				</Text>
				<Flex align="stretch" h="full" alignSelf="stretch" gap={2}>
					{/* Home Page - tylko dla pacjentów i niezalogowanych */}
					{(!isAuthenticated || user?.role === 'PATIENT') && (
						<Box
							h="full"
							display="flex"
							alignItems="center"
							justifyContent="center"
							textAlign="center"
							p={3}
							color="white"
							fontSize="lg"
							fontWeight="bold"
							_hover={{ bg: "blue.500" }}
							cursor="pointer"
							onClick={() => navigate("/home")}
						>
							Home Page
						</Box>
					)}
					
					{/* My Appointments - tylko dla pacjentów */}
					{isAuthenticated && user?.role === 'PATIENT' && (
						<Box
							h="full"
							display="flex"
							alignItems="center"
							justifyContent="center"
							textAlign="center"
							p={3}
							color="white"
							fontSize="lg"
							fontWeight="bold"
							_hover={{ bg: "blue.500" }}
							cursor="pointer"
							onClick={() => navigate("/my-appointments")}
						>
							My Appointments
						</Box>
					)}
					
					{/* Calendar - tylko dla lekarzy */}
					{isAuthenticated && user?.role === 'DOCTOR' && (
						<Box
							h="full"
							display="flex"
							alignItems="center"
							justifyContent="center"
							textAlign="center"
							p={3}
							color="white"
							fontSize="lg"
							fontWeight="bold"
							_hover={{ bg: "blue.500" }}
							cursor="pointer"
							onClick={() => navigate('/')}
						>
							Calendar
						</Box>
					)}

					{/* Przyciski autoryzacji */}
					{isAuthenticated ? (
						<>
							<Box
								h="full"
								display="flex"
								alignItems="center"
								justifyContent="center"
								textAlign="center"
								px={3}
								color="white"
								fontSize="sm"
							>
								{user?.firstName && user?.lastName 
									? `${user.firstName} ${user.lastName}` 
									: user?.email}
							</Box>
							<Box
								h="full"
								display="flex"
								alignItems="center"
								justifyContent="center"
								textAlign="center"
								p={3}
								color="white"
								fontSize="lg"
								fontWeight="bold"
								_hover={{ bg: "blue.500" }}
								cursor="pointer"
								onClick={logout}
							>
								Logout
							</Box>
						</>
					) : (
						<>
							<Box
								h="full"
								display="flex"
								alignItems="center"
								justifyContent="center"
								textAlign="center"
								p={3}
								color="white"
								fontSize="lg"
								fontWeight="bold"
								_hover={{ bg: "blue.500" }}
								cursor="pointer"
								onClick={() => navigate('/login')}
							>
								Login
							</Box>
							<Box
								h="full"
								display="flex"
								alignItems="center"
								justifyContent="center"
								textAlign="center"
								p={3}
								color="white"
								fontSize="lg"
								fontWeight="bold"
								_hover={{ bg: "blue.500" }}
								cursor="pointer"
								onClick={() => navigate('/register')}
							>
								Register
							</Box>
						</>
					)}
				</Flex>
			</Flex>
		</>
	)
};

export default Navbar;