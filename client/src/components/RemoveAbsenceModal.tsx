import { Button, Dialog, Text } from "@chakra-ui/react";
import { useState } from "react";
import { removeAbsence } from "../services/consultationService";

interface RemoveAbsenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    absenceId: string;
    dateRange: string;
    onSuccess: (absenceId: string) => void;
}

const RemoveAbsenceModal = ({ isOpen, onClose, absenceId, dateRange, onSuccess }: RemoveAbsenceModalProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            await removeAbsence(absenceId);
            onSuccess(absenceId);
            onClose();
        } catch (error) {
            console.error("Error removing absence:", error);
            alert("Failed to remove absence");
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
                        <Dialog.Title>Remove Absence</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Text mb={2}>
                            Are you sure you want to remove the absence for:
                        </Text>
                        <Text fontWeight="bold" mb={3}>
                            {dateRange}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                            Note: Previously canceled appointments will NOT be restored automatically.
                        </Text>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button colorPalette="red" onClick={handleRemove} loading={isLoading}>
                            Remove Absence
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};

export default RemoveAbsenceModal;
