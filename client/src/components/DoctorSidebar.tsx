import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";

const DoctorSidebar = () => {

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
						src="https://media.istockphoto.com/id/92347250/photo/portrait-of-a-doctor.jpg?s=612x612&w=0&k=20&c=yKBhDy7ch065QV8mE4ocec8n9uec9VmBDmT137ZjHFo=" />
				</Box>
				{/* TODO: zamień potem na prawdziwe dane lekarza */}
				<Text fontWeight={"bold"}>Dr. Jan Kowalski</Text>
				<Text color={'gray.500'}>Cardiologist</Text>
				<Button colorPalette={'blue'}>Edit profile</Button>
			</Flex>
		</>
	)
}

export default DoctorSidebar;