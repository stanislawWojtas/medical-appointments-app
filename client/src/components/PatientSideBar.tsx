import { Flex, Box, Image, Text, Button } from "@chakra-ui/react";


const PatientSideBar = () => {

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
						alt="Doctor Image" 
						src="https://thumbs.dreamstime.com/b/default-profile-picture-avatar-photo-placeholder-vector-illustration-default-profile-picture-avatar-photo-placeholder-vector-189495158.jpg" />
				</Box>
				{/* TODO: zamień potem na prawdziwe dane pacjenta */}
				<Text fontWeight={"bold"}>Adam Nowak</Text>
				<Text color={'gray.400'}>Patient</Text>
				<Button colorPalette={'blue'}>Edit profile</Button>
			</Flex>
		</>
	)
}

export default PatientSideBar;