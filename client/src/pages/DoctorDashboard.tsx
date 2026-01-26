import { Box, Button, Flex, Text, useDisclosure } from "@chakra-ui/react";
import DoctorCalendar from "../components/DoctorCalendar";
import AbsenceModal from "../components/AbsenceModal";
import AvailabilityModal from "../components/AvailabilityModal";
import type { Appointment } from "../models/Appointment";
import { addAbsence, getAbsences } from "../services/consultationService";
import { useEffect, useState } from "react";
import type { Absence } from "../models/Absence";
import { useAuth } from "../context/AuthContext";

const DoctorDashboard = () => {

	const { user } = useAuth();
	const doctorId = user?.doctorId || '';
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
			const newAbsence = await addAbsence(doctorId, startDate, endDate, reason);
			// dodaj nowy absence do state'u zamiast pobierać wszystkie ponownie
			setAbsences(prev => [...prev, newAbsence]);
		}catch(error){
			console.log("Failed to add absence: ", error)
		}finally{
			onAbsenceClose();
		}
	}

	const handleAbsenceRemoved = (absenceId: string) => {
		setAbsences(prev => prev.filter(a => a.id !== absenceId));
	};

	return(
		<>
			<Box h={"100%"}>
				<Flex justifyContent={"space-between"} alignItems={'center'} p={3}>
					<Text p={0} fontWeight={'bold'} fontSize={'x-large'} letterSpacing={3}>Doctor Panel - Availability Management</Text>
					<Flex alignItems={"center"} gap={5}>
						<Button colorPalette={'blue'} onClick={onAvailabilityOpen}>Add appointments</Button>
						<Button colorPalette={'red'} onClick={onAbsenceOpen}>Add absence</Button>
					</Flex>
				</Flex>
				{/* TODO: zmień hard codowane 1 */}
				<DoctorCalendar isDoctor={true} doctorId={doctorId} absences={absences} onAbsenceRemoved={handleAbsenceRemoved}/>
			</Box>
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