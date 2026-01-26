import { Box, Button, Flex, Grid, GridItem, Separator, Text, useDisclosure } from "@chakra-ui/react";
import { addDays, addMinutes, differenceInMinutes, format, isToday, isWithinInterval, startOfDay, startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { type Appointment, type AppointmentStatus } from "../models/Appointment";
import { createAvailability, getAppointmentsByDates, removeAppointment } from "../services/consultationService";
import Consultation from "./Consultation";
import type { Absence } from "../models/Absence";
import ReservationModal from "./ReservationModal";
import CancelByDoctorModal from "./CancelByDoctorModal";
import CancelByPatientModal from "./CancelByPatientModal";
import RemoveAbsenceModal from "./RemoveAbsenceModal";

interface DoctorCalendarProps{
	doctorId: string;
	isDoctor: boolean;
	absences: Absence[];
	onAbsenceRemoved?: (absenceId: string) => void;
}


const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// z góry zdefiniowana tablica slotów na jeden dzień (jest ich 48 bo co pół godziny)
const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);      // północ
  return addMinutes(start, i * 30); // przesunięcie o 30 min
});

const DoctorCalendar = ({doctorId, isDoctor, absences, onAbsenceRemoved}: DoctorCalendarProps) => {
	

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

	const [cancelModalData, setCancelModalData] = useState<{appointmentId: string, patientName: string} | null>(null);
	const {open: cancelModalOpen, onOpen: onCancelModalOpen, onClose: onCancelModalClose} = useDisclosure();

	const [patientCancelModalId, setPatientCancelModalId] = useState<string | null>(null);
	const {open: patientCancelOpen, onOpen: onPatientCancelOpen, onClose: onPatientCancelClose} = useDisclosure();

	const [removeAbsenceData, setRemoveAbsenceData] = useState<{absenceId: string, dateRange: string, absence: Absence} | null>(null);
	const {open: removeAbsenceOpen, onOpen: onRemoveAbsenceOpen, onClose: onRemoveAbsenceClose} = useDisclosure();

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
	}, [weekStart, absences, doctorId]);

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

	const handleOpenCancelModal = (appointmentId: string, patientName: string) => {
		setCancelModalData({appointmentId, patientName});
		onCancelModalOpen();
	};

	const handlePatientCancelClick = (appointmentId: string) => {
		setPatientCancelModalId(appointmentId);
		onPatientCancelOpen();
	};
	
	const handleCancelSuccess = (appointmentId: string) => {
		setAppointments(prev => prev.map(a => 
			a.id === appointmentId ? {...a, status: 'CANCELED'} : a
		));
		// Jeśli appointment miał duration > 1, zaktualizuj też BLOCKED sloty
		const canceledApp = appointments.find(a => a.id === appointmentId);
		if (canceledApp && canceledApp.duration > 1) {
			setAppointments(prev => prev.map(a => {
				const aDate = new Date(a.date);
				const canceledDate = new Date(canceledApp.date);
				const timeDiff = (aDate.getTime() - canceledDate.getTime()) / (1000 * 60);
				// Jeśli to BLOCKED slot w zakresie duration, zmień na CANCELED
				if (a.doctorId === canceledApp.doctorId && 
					a.status === 'BLOCKED' && 
					timeDiff > 0 && 
					timeDiff < canceledApp.duration * 30) {
					return {...a, status: 'CANCELED'};
				}
				return a;
			}));
		}
	}

	const handlePatientCancelSuccess = (appointmentId: string) => {
		setAppointments(prev => prev.map(a => 
			a.id === appointmentId ? {...a, status: 'AVAILABLE', patientData: undefined, type: undefined, duration: 1} : a
		));
		// Jeśli appointment miał duration > 1, zwolnij też BLOCKED sloty
		const canceledApp = appointments.find(a => a.id === appointmentId);
		if (canceledApp && canceledApp.duration > 1) {
			setAppointments(prev => prev.map(a => {
				const aDate = new Date(a.date);
				const canceledDate = new Date(canceledApp.date);
				const timeDiff = (aDate.getTime() - canceledDate.getTime()) / (1000 * 60);
				if (a.doctorId === canceledApp.doctorId && 
					a.status === 'BLOCKED' && 
					timeDiff > 0 && 
					timeDiff < canceledApp.duration * 30) {
					return {...a, status: 'AVAILABLE'};
				}
				return a;
			}));
		}
	}

	const handleDayHeaderClick = (day: Date) => {
		if (!isDoctor) return;
		
		const absence = absences.find(a => 
			isWithinInterval(day, {
				start: startOfDay(new Date(a.startDate)),
				end: startOfDay(new Date(a.endDate))
			})
		);
		
		if (absence) {
			const dateRange = `${format(new Date(absence.startDate), "dd.MM.yyyy")} - ${format(new Date(absence.endDate), "dd.MM.yyyy")}`;
			setRemoveAbsenceData({ absenceId: absence.id, dateRange, absence });
			onRemoveAbsenceOpen();
		}
	};

	const handleRemoveAbsenceSuccess = (absenceId: string) => {
		const absence = absences.find(a => a.id === absenceId);
		if (absence) {
			const absenceStart = startOfDay(new Date(absence.startDate));
			const absenceEnd = new Date(absence.endDate);
			absenceEnd.setHours(23, 59, 59, 999); // koniec dnia
			
			setAppointments(prev => prev.filter(app => {
				const appDate = new Date(app.date);

				return !(appDate >= absenceStart && appDate <= absenceEnd && app.doctorId === absence.doctorId);
			}));
		}
		onAbsenceRemoved?.(absenceId);
	};

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
						<GridItem 
							key={i} 
							p={2} 
							textAlign={"center"} 
							borderRight={'1px solid black'} 
							bg={isDayAbsent(day, absences) ? 'red.400': isToday(day) ? "yellow.200" : undefined}
							cursor={isDoctor && isDayAbsent(day, absences) ? "pointer" : "default"}
							onClick={() => handleDayHeaderClick(day)}
							_hover={isDoctor && isDayAbsent(day, absences) ? { bg: 'red.500' } : undefined}
						>
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
								
								// Sprawdź czy ten slot jest częścią większego appointmentu (BLOCKED)
								const isPartOfLongerAppointment = appointment && (appointment.status === 'BLOCKED' || (appointment.duration && appointment.duration > 1 && new Date(appointment.date).getTime() !== slotStart.getTime()));
								
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
									{appointment && !isPartOfLongerAppointment ? <Consultation a={appointment} isDoctor={isDoctor} handleRemoveAvailability={handleRemoveAvailability} handlePatientClick={() => handlePatientClick(appointment.id, appointment.status)} onCancelByDoctor={handleOpenCancelModal} onCancelByPatient={handlePatientCancelClick}/> : ( !isAbsence && !isPast(slotStart) && isDoctor && !appointment &&
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
			{cancelModalData && (
				<CancelByDoctorModal 
					isOpen={cancelModalOpen} 
					onClose={() => {
						onCancelModalClose();
						setCancelModalData(null);
					}} 
					appointmentId={cancelModalData.appointmentId}
					patientName={cancelModalData.patientName}
					onSuccess={handleCancelSuccess}
				/>
			)}
			{patientCancelModalId && (
				<CancelByPatientModal
					isOpen={patientCancelOpen}
					onClose={() => {
						onPatientCancelClose();
						setPatientCancelModalId(null);
					}}
					appointmentId={patientCancelModalId}
					onSuccess={handlePatientCancelSuccess}
				/>
			)}
			{removeAbsenceData && (
				<RemoveAbsenceModal
					isOpen={removeAbsenceOpen}
					onClose={() => {
						onRemoveAbsenceClose();
						setRemoveAbsenceData(null);
					}}
					absenceId={removeAbsenceData.absenceId}
					dateRange={removeAbsenceData.dateRange}
					onSuccess={handleRemoveAbsenceSuccess}
				/>
			)}
		</>
	)
}

export default DoctorCalendar;