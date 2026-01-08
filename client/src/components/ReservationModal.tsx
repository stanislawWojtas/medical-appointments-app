import { Button, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogPositioner, DialogRoot, Input, RadioGroup, RadioGroupRoot, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText, Stack, Text, Textarea, createListCollection } from "@chakra-ui/react";
import { useState } from "react";
import { reserveAppointment } from "../services/consultationService";
import type { Appointment, AppointmentType } from "../models/Appointment";

type ReservationModalProps = {
	isOpen:boolean;
	onClose: () => void;
	appointmentId: string;
	onSuccess?: (updatedAppointment: Appointment) => void;
}
const ReservationModal = ({isOpen, onClose, appointmentId, onSuccess}: ReservationModalProps) => {
    const [visitType, setVisitType] = useState<AppointmentType | undefined>(undefined);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [gender, setGender] = useState<'male' | 'female'>();
    const [age, setAge] = useState<string>('');
    const [note, setNote] = useState('');
    
    // Dodaj stany błędów
    const [errors, setErrors] = useState<{[key: string]: string}>({});

	const handleSetAge = (value: string) => {
    const age = value.replace(/\D/g, ''); // usuwa niecyfry
    const ageNum = parseInt(age, 10); // konwertuje na liczbę całkowitą
    setAge(isNaN(ageNum) ? '' : ageNum.toString()); // usuwa wiodące zera i ustawia jako string
}

	const items = [
		{ value: 'FIRST_VISIT', label: 'First Visit' },
		{ value: 'FOLLOW_UP', label: 'Follow Up' },
		{ value: 'CONSULTATION', label: 'Consultation' },
		{ value: 'PRESCRIPTION', label: 'Prescription' },
		{ value: 'TELEVISIT', label: 'Televisit' },
		{ value: 'CHRONIC_CARE', label: 'Chronic Care' },
		{ value: 'DIAGNOSTIC', label: 'Diagnostic' },
	];
	const collection = createListCollection({ items });

    const handleReservation = async () => {
        const newErrors: {[key: string]: string} = {};
        const ageNum = Number(age);
        
        if (!visitType) newErrors.visitType = "Visit type is required.";
        if (!firstName.trim()) newErrors.firstName = "First name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last name is required.";
        if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 200) newErrors.age = "Age must be a number between 0 and 200.";
        if (!gender) newErrors.gender = "Gender is required.";
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        
        const updatedAppointment = await reserveAppointment(appointmentId, visitType, firstName, lastName, gender, ageNum, note);
        if (onSuccess) {
            onSuccess(updatedAppointment);
        }
        onClose();
    };

    return (
        <>
            <DialogRoot
                open={isOpen}
                onOpenChange={(e) => {
                    if (!e.open) onClose();
                }}
                placement={'center'}
            >
                <DialogBackdrop />
                <DialogPositioner>
                    <DialogContent>
                        <DialogHeader color={'blue.500'} fontSize={'xl'} fontWeight={'bold'} letterSpacing={3}>Consultation reservation</DialogHeader>
                        <DialogCloseTrigger />
                        <DialogBody>
                            <Stack gap={4}>
                                <Stack gap={1}>
                                    <Text fontWeight={'medium'}>Select visit type</Text>
                                    <SelectRoot
                                        position={'relative'}
                                        collection={collection}
                                        value={visitType ? [visitType] : []}
                                        onValueChange={(details) => setVisitType(details.value[0] as AppointmentType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Choose visit type" />
                                        </SelectTrigger>
                                        <SelectContent position={"absolute"} w={'100%'} top={10}>
                                            {items.map((item) => (
                                                <SelectItem key={item.value} item={item}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                    {errors.visitType && <Text color="red.500" fontSize="sm">{errors.visitType}</Text>}
                                </Stack>
                                <Stack gap={1}>
                                    <Text fontWeight={'medium'}>First name</Text>
                                    <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                    {errors.firstName && <Text color="red.500" fontSize="sm">{errors.firstName}</Text>}
                                </Stack>
                                <Stack gap={1}>
                                    <Text fontWeight={'medium'}>Last name</Text>
                                    <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    {errors.lastName && <Text color="red.500" fontSize="sm">{errors.lastName}</Text>}
                                </Stack>
                                <Stack gap={1}>
                                    <Text fontWeight={'medium'}>Age</Text>
                                    <Input type='text' value={age} onChange={(e) => handleSetAge(e.target.value)} />
                                    {errors.age && <Text color="red.500" fontSize="sm">{errors.age}</Text>}
                                </Stack>
                                <Stack>
                                    <Text fontWeight={'medium'}>Gender</Text>
                                    <RadioGroupRoot value={gender} onValueChange={(details) => setGender(details.value as 'male' | 'female')}>
                                        <Stack direction="row" gap={3}>
                                            <RadioGroup.Item value="male">
                                                <RadioGroup.ItemHiddenInput />
                                                <RadioGroup.ItemIndicator />
                                                <RadioGroup.ItemText>Male</RadioGroup.ItemText>
                                            </RadioGroup.Item>
                                            <RadioGroup.Item value="female">
                                                <RadioGroup.ItemHiddenInput />
                                                <RadioGroup.ItemIndicator />
                                                <RadioGroup.ItemText>Female</RadioGroup.ItemText>
                                            </RadioGroup.Item>
                                        </Stack>
                                    </RadioGroupRoot>
                                    {errors.gender && <Text color="red.500" fontSize="sm">{errors.gender}</Text>}
                                </Stack>
                                <Stack gap={1}>
                                    <Text>Additional information (optional)</Text>
                                    <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                                </Stack>
                            </Stack>
                        </DialogBody>
                        <DialogFooter gap={3}>
                            <Button variant={"outline"} onClick={onClose}>Cancel</Button>
                            <Button colorPalette={'blue'} onClick={handleReservation}>Reserve</Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogPositioner>
            </DialogRoot>
        </>
    );
};

export default ReservationModal;