import { Box, Button, Flex, Grid, GridItem, Separator, Text, useDisclosure } from "@chakra-ui/react";
import { addDays, addMinutes, differenceInMinutes, format, isToday, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { type Appointment, type AppointmentStatus } from "../models/Appointment";
import { createAvailability, getAppointmentsByDates, removeAppointment } from "../services/consultationService";
import Consultation from "./Consultation";
import type { Absence } from "../models/Absence";
import ReservationModal from "./ReservationModal";

interface DoctorCalendarProps{
	doctorId: string;
	isDoctor: boolean;
	absences: Absence[];
}

const months = 
	[
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	]

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// z góry zdefiniowana tablica slotów na jeden dzień (jest ich 48 bo co pół godziny)
const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);      // północ
  return addMinutes(start, i * 30); // przesunięcie o 30 min
});

const DoctorCalendar = ({doctorId, isDoctor, absences}: DoctorCalendarProps) => {
	

	const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), {weekStartsOn: 1}));
	const [now, setNow] = useState<Date>(new Date()) 

	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	
	const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
	const {open, onOpen, onClose} = useDisclosure();
	const handlePatientClick = (appId: string, appStatus: AppointmentStatus) => {
		if(appStatus !== 'AVAILABLE'){
			return
		}
		setSelectedAppointmentId(appId);
		onOpen();
	}

	useEffect( () => {
		const id = setInterval( () => setNow(new Date()), 60000);
		return () => clearInterval(id);
	}, [])

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try{
				// wszystkie appointments dla całego tygodnia
				const data = await getAppointmentsByDates(weekStart, addDays(weekStart, 7),doctorId);
				setAppointments(data);
			}catch(error){
				console.log("Error fetching the data:, ",error);
			}finally{
				setIsLoading(false);
			}
		}
		fetchData();
	}, [weekStart, absences]);

	const weekDays = useMemo(
		() => Array.from({length: 7}, (_, i) => addDays(weekStart, i)),
		[weekStart]
	)

	const handlePrevWeek = () => {
		setWeekStart(addDays(weekStart, -7));
	}
	const handleNextWeek = () => {
		setWeekStart(addDays(weekStart, 7));
	}

	const isDayAbsent = (day: Date, absences: Absence[]) => 
		absences.some(a => 
			isWithinInterval(day, {
				start: startOfDay(new Date(a.startDate)),
				end: startOfDay(new Date(a.endDate)) 	
			})
		);
	
	const isPast = (date: Date) => {
		return(new Date(date) < new Date)
	}
	
	const handleAddAvailability = async (slotDate: Date) => {
		const newAvailability = await createAvailability(doctorId, slotDate);
		setAppointments(prev => [...prev, newAvailability])
	}

	const handleRemoveAvailability = async(appointmentId: string) => {
		const removedAppointment = await removeAppointment(appointmentId);
		if(removedAppointment !== undefined){
			setAppointments((prev => prev.filter(a => a.id !== appointmentId)))
		}
	}

	const handleBookingSuccess = (updatedAppointment: Appointment) => {
		setAppointments(prev => prev.map(a => 
			a.id === updatedAppointment.id ? updatedAppointment : a
		));
	}
	

	return(
		<>
			<Flex h={'calc(100% - 7rem)'} bg={'white'} m={8} borderRadius={'lg'} boxShadow={'md'} flexDirection={"column"}>
				<Flex justifyContent={"space-between"} w={'100%'} p={3} alignItems={"center"}>
					<Button colorPalette={'blue'} onClick={handlePrevWeek}>{'<'}</Button>
					<Text fontSize={'lg'} fontWeight={'bold'}>Week {format(weekDays[0], "d.MM.yyyy")} - {format(weekDays[6], "d.MM.yyyy")}</Text>
					<Button colorPalette={'blue'} onClick={handleNextWeek}>{'>'}</Button>
				</Flex>
				<Separator />

				<Flex direction={"column"} flex={1} overflow={'auto'}>
					<Grid templateColumns={'80px repeat(7, 1fr)'} bg={"gray.100"} borderBottom={'2px solid black'} position={'sticky'} top={0} zIndex={100}>
						<GridItem p={2} borderRight={"1px solid black"}></GridItem>
						{weekDays.map((day, i) => (
							<GridItem key={i} p={2} textAlign={"center"} borderRight={'1px solid black'} bg={isDayAbsent(day, absences) ? 'red.400': isToday(day) ? "yellow.200" : undefined}>
								<Text fontWeight={'bold'}>{dayNames[i]}{isDayAbsent(day, absences) && " (Absence)"}</Text>
								<Text fontSize={'sm'}>{format(day, "d MMM")}</Text>
							</GridItem>
						))}
					</Grid>

					{timeSlots.map( (slot, i) => (
						<Grid key={i} templateColumns={'80px repeat(7, 1fr)'} borderBottom={'1px solid black'}>
							<GridItem p={2} bg={'gray.50'} borderRight={'1px solid black'}>
								<Text fontSize={'sm'}>{format(slot, "HH:mm")}</Text>
							</GridItem>
							
							{weekDays.map((day, idx) => {
								const isCurrentSlot = isToday(day) && isWithinInterval(now, { start: slot, end: addMinutes(slot, 30) });
								const offsetPct = isCurrentSlot ? (differenceInMinutes(now, slot) / 30) * 100 : 0;
								const isAbsence = isDayAbsent(day, absences);

								const slotStart = new Date(day);
								slotStart.setHours(slot.getHours(), slot.getMinutes(), 0, 0);
								const slotEnd = addMinutes(slotStart, 30);
								const appointment = appointments.find(a => {
									const d = new Date(a.date);
									return d >= slotStart && d < slotEnd;
								})
								return(
								<GridItem
									key={idx}
									p={2}
									textAlign={'center'}
									position={'relative'}
									borderRight={'1px solid black'}
									minH={'64px'}
									_hover={isAbsence ? undefined : { bg: 'blue.50' }}
									bg={isAbsence ? 'red.200' : isToday(day) ? 'yellow.100' : undefined}
								>
									{appointment ? <Consultation a={appointment} isDoctor={isDoctor} handleRemoveAvailability={handleRemoveAvailability} handlePatientClick={() => handlePatientClick(appointment.id, appointment.status)}/> : ( !isAbsence && !isPast(slotStart) && isDoctor &&
										<Text color={'gray.400'} cursor={"pointer"} onClick={() => handleAddAvailability(slotStart)}>Add availability</Text>
										)}
									{isCurrentSlot && (
										<Box
											position={'absolute'}
											left={0}
											right={0}
											height={'2px'}
											bg={'red'}
											top={`${offsetPct}%`}
											transform={'translateY(-1px)'}
											pointerEvents={'none'}
										/>
									)}
								</GridItem>
							)})}
						</Grid>
					))}
				</Flex>
			</Flex>
			<ReservationModal isOpen={open} onClose={onClose} appointmentId={selectedAppointmentId} onSuccess={handleBookingSuccess}/>
		</>
	)
}

export default DoctorCalendar;