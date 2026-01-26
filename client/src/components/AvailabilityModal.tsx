import { 
    Box, Button, Dialog, Flex, Input, Text, Checkbox, Separator, Stack 
} from "@chakra-ui/react";
import { useState } from "react";
import { createAvailability } from "../services/consultationService";
import { addMinutes, eachDayOfInterval, setHours, setMinutes, getDay } from "date-fns";
import type { Appointment } from "../models/Appointment";

interface AvailabilityModalProps {
    open: boolean;
    onOpenChange: (details: { open: boolean }) => void;
    doctorId: string;
    onSuccess: (newSlots: Appointment[]) => void; 
    handleNewSlots: (newSlots: Appointment[]) => void;
}

// Konfiguracja domyślna dla jednego dnia
type DayConfig = {
    active: boolean;
    start: string;
    end: string;
};

const INITIAL_CONFIG: Record<number, DayConfig> = {
    1: { active: true, start: "08:00", end: "16:00" }, // Poniedziałek
    2: { active: true, start: "08:00", end: "16:00" }, // Wtorek
    3: { active: true, start: "08:00", end: "16:00" }, // Środa
    4: { active: true, start: "08:00", end: "16:00" }, // Czwartek
    5: { active: true, start: "08:00", end: "14:00" }, // Piątek
    6: { active: false, start: "10:00", end: "14:00" }, // Sobota
    0: { active: false, start: "10:00", end: "14:00" }, // Niedziela
};

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const AvailabilityModal = ({ open, onOpenChange, doctorId, onSuccess , handleNewSlots}: AvailabilityModalProps) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const todayIso = new Date().toISOString().split('T')[0];

    const [daysConfig, setDaysConfig] = useState(INITIAL_CONFIG);

    const updateDayConfig = (dayIndex: number, field: keyof DayConfig, value: any) => {
        setDaysConfig(prev => ({
            ...prev,
            [dayIndex]: { ...prev[dayIndex], [field]: value }
        }));
    };

    const handleGenerate = async () => {
        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const creationPromises: Promise<Appointment | undefined>[] = [];

        const daysInRange = eachDayOfInterval({ start, end });

        daysInRange.forEach((currentDate) => {
            const dayOfWeek = getDay(currentDate); // 0 (Sun) - 6 (Sat)
            const config = daysConfig[dayOfWeek];

            if (config.active) {
                const [sh, sm] = config.start.split(":").map(Number);
                const [eh, em] = config.end.split(":").map(Number);

                let slotTime = setMinutes(setHours(currentDate, sh), sm);
                const endTime = setMinutes(setHours(currentDate, eh), em);

                while (slotTime < endTime) {
                    creationPromises.push(createAvailability(doctorId, new Date(slotTime)));
                    slotTime = addMinutes(slotTime, 30);
                }
            }
        });

        const createdSlots = await Promise.all(creationPromises);
        const newSlots = createdSlots.filter((slot): slot is Appointment => Boolean(slot));

        handleNewSlots(newSlots);
        onSuccess(newSlots);
        onOpenChange({ open: false });
    };

    const orderedDays = [1, 2, 3, 4, 5, 6, 0]; 

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange} size="lg"> 
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Working Hours Scheduler</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Stack gap={6}>
                            <Box>
                                <Text fontWeight="bold" mb={2}>1. Select the validity period for the schedule:</Text>
                                <Flex gap={4}>
                                    <Box flex={1}>
                                        <Text fontSize="xs" color="gray.500">From</Text>
                                        <Input type="date" min={todayIso} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontSize="xs" color="gray.500">To</Text>
                                        <Input type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </Box>
                                </Flex>
                            </Box>

                            <Separator />

                            <Box>
                                <Text fontWeight="bold" mb={2}>2. Select working hours:</Text>
                                <Stack gap={2}>
                                    {orderedDays.map(dayIndex => (
                                        <Flex key={dayIndex} align="center" gap={3}>
                                            <Checkbox.Root 
                                                checked={daysConfig[dayIndex].active}
                                                onCheckedChange={(e) => updateDayConfig(dayIndex, 'active', !!e.checked)}
                                            >
                                                <Checkbox.HiddenInput />
                                                <Checkbox.Control />
                                                <Checkbox.Label width="100px">
                                                    {DAY_NAMES[dayIndex]}
                                                </Checkbox.Label>
                                            </Checkbox.Root>

                                            <Flex gap={2} opacity={daysConfig[dayIndex].active ? 1 : 0.3}>
                                                <Input 
                                                    type="time" 
                                                    width="110px" 
                                                    size="sm"
                                                    disabled={!daysConfig[dayIndex].active}
                                                    value={daysConfig[dayIndex].start}
                                                    onChange={e => updateDayConfig(dayIndex, 'start', e.target.value)}
                                                />
                                                <Text alignSelf="center">-</Text>
                                                <Input 
                                                    type="time" 
                                                    width="110px" 
                                                    size="sm"
                                                    disabled={!daysConfig[dayIndex].active}
                                                    value={daysConfig[dayIndex].end}
                                                    onChange={e => updateDayConfig(dayIndex, 'end', e.target.value)}
                                                />
                                            </Flex>
                                        </Flex>
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </Dialog.CloseTrigger>
                        <Button colorPalette="blue" onClick={handleGenerate}>
                            Generate
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};

export default AvailabilityModal;