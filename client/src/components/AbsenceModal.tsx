import {
  Button,
  DialogBody,
  DialogBackdrop,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogPositioner,
  Input,
  Textarea,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

type AbsenceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (startDate: Date, endDate: Date, reason?: string) => void;
};

const AbsenceModal = ({ isOpen, onClose, onSuccess }: AbsenceModalProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const todayIso = new Date().toISOString().split('T')[0];

  const handleSave = () => {
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be later than end date.");
      return;
    }
    onSuccess(new Date(startDate), new Date(endDate), reason);
    onClose();
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      placement="center"
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>Add new absence</DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <Stack gap={4}>
              <Stack gap={1}>
                <Text fontWeight="medium">Start date</Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayIso}
                />
              </Stack>

              <Stack gap={1}>
                <Text fontWeight="medium">End date</Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </Stack>

              <Stack gap={1}>
                <Text fontWeight="medium">Reason</Text>
                <Textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Stack>
            </Stack>
          </DialogBody>
          <DialogFooter gap={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="blue" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default AbsenceModal;