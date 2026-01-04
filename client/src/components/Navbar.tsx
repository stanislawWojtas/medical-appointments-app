import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";

const Navbar = () => {
	const navigate = useNavigate();

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
				</Flex>
			</Flex>
		</>
	)
};

export default Navbar;