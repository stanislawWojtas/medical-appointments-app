import { Button, Flex, IconButton, Text, Tooltip } from "@chakra-ui/react";
import type { Appointment, AppointmentStatus, AppointmentType } from "../models/Appointment";
import { FiTrash2 } from "react-icons/fi";
import { FiX } from "react-icons/fi"; // ikona do anulowania
import { useAuth } from "../context/AuthContext";

const statusColor: Record<AppointmentStatus, string> = {
	BOOKED: 'red.300',
	AVAILABLE: 'green.300',
	COMPLETED: 'gray.300',
	CANCELED: 'gray.300',
    BLOCKED: 'white'
}

const typeDoctorColor: Record<AppointmentType, string> = {
	CHRONIC_CARE: 'orange.300',
	CONSULTATION: 'pink.300',
	DIAGNOSTIC: 'purple.300',
	FIRST_VISIT: 'teal.300',
	FOLLOW_UP: 'red.200',
	PRESCRIPTION: 'cyan.600',
	TELEVISIT: 'blue.400',
}
const Consultation = ({a, isDoctor, handlePatientClick, handleRemoveAvailability, onCancelByDoctor, onCancelByPatient}:
     {a: Appointment, isDoctor:boolean, handlePatientClick: () => void, handleRemoveAvailability: (id: string) => void, onCancelByDoctor?: (appointmentId: string, patientName: string) => void, onCancelByPatient?: (appointmentId: string) => void}) => {

    const { user } = useAuth();
    const isPast:boolean = new Date(a.date) < new Date();
    const height = `calc(${a.duration * 100}% - 8px)`; // 4px dla padding/margines
    
    const isMyAppointment = !isDoctor && a.patientId === user?.id;

    const getTypeColor = (type?: AppointmentType) => {
        if (!type) return 'green.500';
        return typeDoctorColor[type];
    }

    

    return(
        <>
            {/* Widok lekarza */}
            {isDoctor ? 
            (<Tooltip.Root openDelay={100} closeDelay={50} positioning={{ gutter: 8 }}>
                <Tooltip.Trigger asChild>
                    <Flex
                        m={0}
                        h={height}
                        position={"absolute"}
                        top={"4px"}
                        left={"4px"}
                        right={"4px"}
                        zIndex={a.duration > 1 ? 10 : 1}
                        bg={(isPast || a.status ==="CANCELED") ? 'gray.300' : getTypeColor(a.type)}
                        cursor="pointer"
                        borderRadius="lg"
                        p={0}
                        justify="center"
                        align="center"
                    >
                        {a.status === "CANCELED" ? (
                            <Text fontWeight="bold">Canceled</Text>
                        ) : a.status !== "AVAILABLE" ? (
                            <Flex direction="column" align="center" gap={1}>
                                <Text fontSize="sm" fontWeight="bold">
                                    {a.patientData?.firstName} {a.patientData?.lastName}
                                </Text>
                                {!isPast && a.status === "BOOKED" && (
                                    <IconButton
                                        aria-label="Cancel appointment"
                                        size="xs"
                                        colorPalette="red"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelByDoctor?.(a.id, `${a.patientData?.firstName || ''} ${a.patientData?.lastName || ''}`);
                                        }}
                                    >
                                        <FiX />
                                    </IconButton>
                                )}
                            </Flex>
                        ) : (
                            <Flex gap={1} align={'center'}>
                                <Text fontWeight="bold">Available</Text>
                                {!isPast && <IconButton
                                    aria-label="Remove slot"
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveAvailability(a.id)}}>
                                    <FiTrash2 />
                                </IconButton>}
                            </Flex>
                        )}
                    </Flex>
                </Tooltip.Trigger>

                {a.patientData && (
                    <>
                    <Tooltip.Positioner>
                        <Tooltip.Content
                            p={3}
                            bg="gray.500"
                            color="white"
                            borderRadius="md"
                            shadow="lg"
                            zIndex="popover"
                        >
                            <Text fontWeight="bold">{a.patientData.firstName} {a.patientData.lastName}</Text>
                            {a.type && <Text fontSize="sm">Type: {a.type.replace('_', ' ').toLowerCase()}</Text>}
                            {a.duration && <Text fontSize="sm">Duration: {a.duration * 30} min</Text>}
                            {a.patientData?.notes && <Text fontSize="sm">Additional information: {a.patientData.notes}</Text>}
                            <Tooltip.Arrow />
                        </Tooltip.Content>
                    </Tooltip.Positioner>
                    </>
                )}
                {/* Widok pacjenta */}
            </Tooltip.Root>) : (
                <Flex
                        m={0}
                        h={height}
                        position={"absolute"}
                        top={"4px"}
                        left={"4px"}
                        right={"4px"}
                        zIndex={a.duration > 1 ? 10 : 1}
                        bg={isPast ? 'gray.300' : statusColor[a.status]}
                        cursor="pointer"
                        borderRadius="lg"
                        p={0}
                        justify="center"
                        align="center"
                        onClick={() => {if(!isPast && a.status === 'AVAILABLE') handlePatientClick()}}
                    >
                        {a.status === "CANCELED" ? (
                            <Text fontWeight="bold">Canceled</Text>
                        ) : a.status !== "AVAILABLE" ? (
                            <Flex direction="column" align="center" gap={1}>
                                <Text fontWeight="bold">{isMyAppointment ? 'My Appointment' : 'Booked'}</Text>
                                {!isPast && a.status === "BOOKED" && isMyAppointment && (
                                    <Button
                                        size="xs"
                                        colorPalette="red"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCancelByPatient?.(a.id);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </Flex>
                        ) : (
                            <Text fontWeight="bold">Available</Text>
                            
                        )}
                    </Flex>
            )}
        </>
        
    )
}

export default Consultation;