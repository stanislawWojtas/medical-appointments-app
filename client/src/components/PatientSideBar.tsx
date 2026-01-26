import { Flex, Box, Image, Text, Button } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";


const PatientSideBar = () => {
	const { user } = useAuth();

	return(
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
						alt="Patient Image" 
						src="https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg" />
				</Box>
				<Text fontWeight={"bold"}>{user?.email || 'User'}</Text>
				<Text color={'gray.400'}>{user?.role || 'PATIENT'}</Text>
			</Flex>
		</>
	)
}

export default PatientSideBar;