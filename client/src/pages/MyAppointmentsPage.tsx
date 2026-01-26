import { Box, Heading, Stack, Text, Button, Flex, Badge, Tabs, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogCloseTrigger, DialogPositioner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Appointment } from "../models/Appointment";
import ReviewModal from "../components/ReviewModal";
import * as consultationService from "../services/consultationService";

const MyAppointmentsPage = () => {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [appointmentToReview, setAppointmentToReview] = useState<Appointment | null>(null);

	useEffect(() => {
		fetchAppointments();
	}, []);

	const fetchAppointments = async () => {
		try {
			const appointments = await consultationService.getMyAppointments();
			setAppointments(appointments);
		} catch (error) {
			console.error("Error fetching appointments:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelAppointment = async (appointmentId: string) => {
		setAppointmentToCancel(appointmentId);
		setCancelModalOpen(true);
	};

	const handleAddReview = (appointment: Appointment) => {
		setAppointmentToReview(appointment);
		setReviewModalOpen(true);
	};

	const confirmCancelAppointment = async () => {
		if (!appointmentToCancel) return;

		try {
			await consultationService.cancelAppointmentByPatient(appointmentToCancel);
			setCancelModalOpen(false);
			setAppointmentToCancel(null);
			
			fetchAppointments();
		} catch (error) {
			console.error("Error canceling appointment:", error);
			alert("Failed to cancel appointment");
		}
	};

	// Podział na nadchodzące i historię
	const now = new Date();
	const upcomingAppointments = appointments.filter(apt => {
		const aptDate = new Date(apt.date);
		return aptDate >= now && apt.status === "BOOKED";
	});

	const pastAppointments = appointments.filter(apt => {
		const aptDate = new Date(apt.date);
		return aptDate < now || apt.status !== "BOOKED";
	});

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "BOOKED": return "green";
			case "CANCELED": return "red";
			case "COMPLETED": return "blue";
			default: return "gray";
		}
	};

	const renderAppointment = (appointment: Appointment, showCancel: boolean = false, showReview: boolean = false) => (
		<Box
			key={appointment.id}
			p={4}
			borderWidth="1px"
			borderRadius="lg"
			bg="white"
			_hover={{ shadow: "md" }}
		>
			<Flex justify="space-between" align="start">
				<Box flex="1">
					<Flex align="center" gap={2} mb={2}>
						<Heading size="md">
							Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
						</Heading>
						<Badge colorScheme={getStatusColor(appointment.status)}>
							{appointment.status.replace(/_/g, ' ').toUpperCase()}
						</Badge>
					</Flex>
					<Text color="gray.600" mb={1}>
						<strong>Specialization:</strong> {appointment.doctor?.specialization}
					</Text>
					<Text color="gray.600" mb={1}>
						<strong>Date:</strong> {formatDate(appointment.date)}
					</Text>
					{appointment.patientData && (
						<Text color="gray.600" mb={1}>
							<strong>Patient:</strong> {appointment.patientData.firstName} {appointment.patientData.lastName}
						</Text>
					)}
					{appointment.patientData?.notes && (
						<Text color="gray.600" mt={2}>
							<strong>Notes:</strong> {appointment.patientData.notes}
						</Text>
					)}
				</Box>
				
				<Flex gap={2}>
					{showCancel && appointment.status === "BOOKED" && (
						<Button
							colorPalette="red"
							size="sm"
							onClick={() => handleCancelAppointment(appointment.id)}
						>
							Cancel
						</Button>
					)}
					
					{showReview && appointment.status === "COMPLETED" && (
						<Button
							colorPalette="blue"
							size="sm"
							onClick={() => handleAddReview(appointment)}
						>
							Add Review
						</Button>
					)}
				</Flex>
			</Flex>
		</Box>
	);

	if (isLoading) {
		return (
			<Box p={6}>
				<Text>Loading your appointments...</Text>
			</Box>
		);
	}

	return (
		<Box p={6}>
			<Heading mb={6}>My Appointments</Heading>

			<Tabs.Root defaultValue="upcoming" colorPalette="blue">
				<Tabs.List>
					<Tabs.Trigger value="upcoming">Upcoming ({upcomingAppointments.length})</Tabs.Trigger>
					<Tabs.Trigger value="history">History ({pastAppointments.length})</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="upcoming" pt={4}>
					{upcomingAppointments.length === 0 ? (
						<Text>No upcoming appointments.</Text>
					) : (
						<Stack gap={4}>
							{upcomingAppointments.map(apt => renderAppointment(apt, true))}
						</Stack>
					)}
				</Tabs.Content>

				<Tabs.Content value="history" pt={4}>
					{pastAppointments.length === 0 ? (
						<Text>No past appointments.</Text>
					) : (
						<Stack gap={4}>
							{pastAppointments.map(apt => renderAppointment(apt, false, true))}
						</Stack>
					)}
				</Tabs.Content>
			</Tabs.Root>

			{/* Modal potwierdzenia anulowania */}
			<DialogRoot open={cancelModalOpen} onOpenChange={(e) => setCancelModalOpen(e.open)}>
				<DialogBackdrop />
				<DialogPositioner>
					<DialogContent>
						<DialogHeader>Cancel Appointment</DialogHeader>
						<DialogCloseTrigger />
						<DialogBody>
							<Text>Are you sure you want to cancel this appointment? This action cannot be undone.</Text>
						</DialogBody>
						<DialogFooter>
							<Button variant="outline" onClick={() => setCancelModalOpen(false)}>
								No, Keep It
							</Button>
							<Button colorPalette="red" onClick={confirmCancelAppointment}>
								Yes, Cancel Appointment
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogPositioner>
			</DialogRoot>

			{/* Modal dodawania recenzji */}
			{appointmentToReview && (
				<ReviewModal
					isOpen={reviewModalOpen}
					onClose={() => {
						setReviewModalOpen(false);
						setAppointmentToReview(null);
					}}
					appointment={appointmentToReview}
					onSuccess={fetchAppointments}
				/>
			)}
		</Box>
	);
};

export default MyAppointmentsPage;
