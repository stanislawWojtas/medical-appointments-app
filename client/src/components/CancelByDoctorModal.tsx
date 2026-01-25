import { Button, Dialog, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { cancelAppointmentByDoctor } from "../services/consultationService";

interface CancelByDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    patientName: string;
    onSuccess: (appointmentId: string) => void;
}

const CancelByDoctorModal = ({ isOpen, onClose, appointmentId, patientName, onSuccess }: CancelByDoctorModalProps) => {
    const [reason, setReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            await cancelAppointmentByDoctor(appointmentId, reason || undefined);
            onSuccess(appointmentId);
            onClose();
        } catch (error) {
            console.error("Error canceling appointment:", error);
            alert("Failed to cancel appointment");
        } finally {
            setIsLoading(false);
            setReason("");
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Cancel Appointment</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Text mb={4}>
                            Are you sure you want to cancel the appointment with <strong>{patientName}</strong>?
                        </Text>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                            Reason for cancellation (optional):
                        </Text>
                        <Input
                            placeholder="e.g., Emergency, Personal reasons..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Close
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

export default CancelByDoctorModal;