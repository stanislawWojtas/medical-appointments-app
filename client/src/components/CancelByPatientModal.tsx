import { Button, Dialog, Text } from "@chakra-ui/react";
import { useState } from "react";
import { cancelAppointmentByPatient } from "../services/consultationService";

interface CancelByPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    onSuccess: (appointmentId: string) => void;
}

const CancelByPatientModal = ({ isOpen, onClose, appointmentId, onSuccess }: CancelByPatientModalProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            await cancelAppointmentByPatient(appointmentId);
            onSuccess(appointmentId);
            onClose();
        } catch (error) {
            console.error("Error canceling appointment:", error);
            alert("Failed to cancel appointment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Cancel Your Appointment</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Text>
                            Are you sure you want to cancel your appointment? This slot will become available for other patients.
                        </Text>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Keep Appointment
                        </Button>
                        <Button colorPalette="red" onClick={handleCancel} loading={isLoading}>
                            Cancel Appointment
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};

export default CancelByPatientModal;
