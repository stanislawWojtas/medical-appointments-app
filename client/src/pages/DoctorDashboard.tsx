import { Box, Button, Flex, Text, useDisclosure } from "@chakra-ui/react";
import DoctorSidebar from "../components/DoctorSidebar";
import DoctorCalendar from "../components/DoctorCalendar";
import AbsenceModal from "../components/AbsenceModal";
import AvailabilityModal from "../components/AvailabilityModal";
import type { Appointment } from "../models/Appointment";
import { addAbsence, getAbsences } from "../services/consultationService";
import { useEffect, useState } from "react";
import type { Absence } from "../models/Absence";

const DoctorDashboard = () => {

	// 
	const doctorId = '1';
	// modale: osobne sterowanie dla nieobecności i dostępności
	const { open: isAbsenceOpen, onOpen: onAbsenceOpen, onClose: onAbsenceClose } = useDisclosure();
	const { open: isAvailabilityOpen, setOpen: setAvailabilityOpen, onOpen: onAvailabilityOpen } = useDisclosure();

	const [absences, setAbsences] = useState<Absence[]>([]);

	useEffect(() => {
		const fetchAbsences = async () => {
			try{
				const data = await getAbsences(doctorId);
				setAbsences(data)
			}catch(error){
				console.log("Error fetching the data: ", error)
			}
		}
		fetchAbsences();
	}, [])

	const handleNewSlots = (slots: Appointment[]) => {
		console.table(slots)
	}
	const handleNewAbsence = async (startDate: Date, endDate: Date, reason?: string) => {
		try{
			await addAbsence(doctorId, startDate, endDate, reason);
			// po dodaniu ponownie pobierz listę, żeby mieć zawsze tablicę
			const refreshed = await getAbsences(doctorId);
			setAbsences(refreshed);
		}catch(error){
			console.log("Failed to add absence: ", error)
		}finally{
			onAbsenceClose();
		}
	}
	return(
		<>
			<Flex h={"calc(100% - 72px)"}>
				<Box flex={1}>
					<DoctorSidebar />
				</Box>
				<Box flex={5} bg={'gray.200'}>
					<Flex justifyContent={"space-between"} alignItems={'center'} p={3}>
						<Text p={0} fontWeight={'bold'} fontSize={'x-large'} letterSpacing={3}>Doctor Panel - Availability Management</Text>
						<Flex alignItems={"center"} gap={5}>
							<Button colorPalette={'blue'} onClick={onAvailabilityOpen}>Add appointments</Button>
							<Button colorPalette={'red'} onClick={onAbsenceOpen}>Add absence</Button>
						</Flex>
					</Flex>
					{/* TODO: zmień hard codowane 1 */}
					<DoctorCalendar isDoctor={true} doctorId={'1'} absences={absences}/>
				</Box>
			</Flex>
			{/* modals */}
			<AbsenceModal isOpen={isAbsenceOpen} onClose={onAbsenceClose} onSuccess={handleNewAbsence}/>
			<AvailabilityModal
				doctorId={doctorId}
				open={isAvailabilityOpen}
				onOpenChange={({ open }) => setAvailabilityOpen?.(open)}
				onSuccess={() => setAvailabilityOpen?.(false)}
				handleNewSlots={handleNewSlots}
			/>
		</>
	)
};

export default DoctorDashboard;