import { Flex, Box } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router";

const AdminNav = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const navItems = [
		{ path: '/admin/register-doctor', label: 'Register Doctor' },
		{ path: '/admin/patients', label: 'Manage Patients' },
		{ path: '/admin/reviews', label: 'Doctor Reviews' }
	];

	return (
		<Flex
			bg="white"
			borderBottomWidth="1px"
			borderColor="gray.200"
			px={6}
			gap={1}
		>
			{navItems.map((item) => (
				<Box
					key={item.path}
					px={4}
					py={3}
					cursor="pointer"
					fontWeight="medium"
					borderBottomWidth="2px"
					borderColor={location.pathname === item.path ? 'blue.500' : 'transparent'}
					color={location.pathname === item.path ? 'blue.600' : 'gray.600'}
					_hover={{ color: 'blue.600', bg: 'gray.50' }}
					onClick={() => navigate(item.path)}
				>
					{item.label}
				</Box>
			))}
		</Flex>
	);
};

export default AdminNav;
