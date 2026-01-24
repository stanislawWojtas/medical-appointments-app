import { Button, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogPositioner, DialogRoot, Input, RadioGroup, RadioGroupRoot, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText, Stack, Text, Textarea, createListCollection, Spinner, Flex, Box, Separator, Center} from "@chakra-ui/react";
import { useState } from "react";
import { reserveAppointment } from "../services/consultationService";
import type { Appointment, AppointmentType } from "../models/Appointment";


type ReservationModalProps = {
	isOpen:boolean;
	onClose: () => void;
	appointmentId: string;
	onSuccess?: (updatedAppointment: Appointment) => void;
    price?: number;
}

// kroki w rezerwacji
type ModalStep = 'FORM' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS';
const ReservationModal = ({isOpen, onClose, appointmentId, onSuccess, price = 150}: ReservationModalProps) => {
    const [visitType, setVisitType] = useState<AppointmentType | undefined>(undefined);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [gender, setGender] = useState<'male' | 'female' | undefined>(undefined);
    const [age, setAge] = useState<string>('');
    const [note, setNote] = useState('');
    const [slots, setSlots] = useState(1);

    const [currentStep, setCurrentStep] = useState<ModalStep>('FORM');

    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [errorMessage, setErrorMessage] = useState<string>('');

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

    const handleClose = () => {
        setCurrentStep('FORM');
        setCardNumber('');
        setCvv('');
        setExpiryDate('');
        setErrors({});
        setErrorMessage('');
        onClose();
    };

    const handleProceedToPayment = () => {
        const newErrors: {[key: string]: string} = {};
        const ageNum = Number(age);
        
        if (!visitType) newErrors.visitType = "Visit type is required.";
        if (!firstName.trim()) newErrors.firstName = "First name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last name is required.";
        if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 200) newErrors.age = "Age must be a number between 0 and 200.";
        if (!gender) newErrors.gender = "Gender is required.";
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        
        setCurrentStep('PAYMENT');
    }

    const handlePayAndBook = async () => {
        setCurrentStep('PROCESSING');
        
        setTimeout(async () => {
            try {
                const ageNum = Number(age);
                const updatedAppointment = await reserveAppointment(
                    appointmentId, 
                    visitType!, 
                    firstName, 
                    lastName, 
                    gender!, 
                    ageNum, 
                    slots, 
                    note
                );
                
                setCurrentStep('SUCCESS');
                
                if (onSuccess) {
                    onSuccess(updatedAppointment);
                }
                
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } catch (error: unknown) {
                console.error(error);
                
                // Wyciągięcie informacji o błędzie z backendu jeśli jest
                const status = (error as any).response?.status;
                const message = (error as any).response?.data?.message || (error as any).response?.data?.error || (error as Error).message;
                
                let description = "Unable to complete the reservation. Please try again.";
                
                if (status === 409) {
                    description = message || "This time slot has already been booked. Please choose another time.";
                } else if (status === 400) {
                    description = message || "Please check your information and try again.";
                } else if (message) {
                    description = message;
                }
                
                setErrorMessage(description);
                setCurrentStep('PAYMENT');
            }
        }, 2500);
    };

    return (
        <DialogRoot
                open={isOpen}
                onOpenChange={(e) => {
                    if (!e.open) handleClose();
                }}
                placement={'center'}
                size="lg"
            >
            <DialogBackdrop />
            <DialogPositioner>
                <DialogContent>
                    <DialogHeader color={'blue.600'} fontSize={'xl'} fontWeight={'bold'}>
                        {currentStep === 'FORM' && "1. Patient Details"}
                        {currentStep === 'PAYMENT' && "2. Secure Payment"}
                        {currentStep === 'PROCESSING' && "Processing..."}
                        {currentStep === 'SUCCESS' && "Success!"}
                    </DialogHeader>
                    <DialogCloseTrigger onClick={handleClose} />
                    
                    <DialogBody>
                        {/* --- KROK 1: FORMULARZ DANYCH --- */}
                        {currentStep === 'FORM' && (
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
                                
                                <Flex gap={2}>
                                    <Box flex={1}>
                                        <Text fontWeight={'medium'}>First name</Text>
                                        <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                        {errors.firstName && <Text color="red.500" fontSize="sm">{errors.firstName}</Text>}
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontWeight={'medium'}>Last name</Text>
                                        <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                        {errors.lastName && <Text color="red.500" fontSize="sm">{errors.lastName}</Text>}
                                    </Box>
                                </Flex>

                                <Flex gap={2}>
                                    <Box flex={1}>
                                        <Text fontWeight={'medium'}>Age</Text>
                                        <Input type='text' value={age} onChange={(e) => handleSetAge(e.target.value)} />
                                        {errors.age && <Text color="red.500" fontSize="sm">{errors.age}</Text>}
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontWeight={'medium'}>Gender</Text>
                                        <RadioGroupRoot value={gender} onValueChange={(details) => setGender(details.value as 'male' | 'female')}>
                                            <Stack direction="row" gap={3} mt={2}>
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
                                    </Box>
                                </Flex>

                                <Stack gap={1}>
                                    <Text fontWeight={'medium'}>Number of slots</Text>
                                    <Input type="number" value={slots} min={1} onChange={(e) => setSlots(Number(e.target.value) || 1)} />
                                </Stack>

                                <Stack gap={1}>
                                    <Text>Additional information (optional)</Text>
                                    <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                                </Stack>
                            </Stack>
                        )}

                        {/* --- KROK 2: FAKE PŁATNOŚĆ --- */}
                        {currentStep === 'PAYMENT' && (
                            <Stack gap={5}>
                                {errorMessage && (
                                    <Box bg="red.50" borderColor="red.500" borderWidth={1} p={4} borderRadius="md">
                                        <Flex gap={2} align="center">
                                            <Text fontSize="xl">❌</Text>
                                            <Box>
                                                <Text fontWeight="bold" color="red.700">Booking Failed</Text>
                                                <Text color="red.600" fontSize="sm">{errorMessage}</Text>
                                            </Box>
                                        </Flex>
                                    </Box>
                                )}
                                <Box bg="blue.50" p={4} borderRadius="md">
                                    <Text fontWeight="bold" fontSize="lg" mb={2}>Summary</Text>
                                    <Flex justify="space-between" mb={1}>
                                        <Text>Visit type:</Text>
                                        <Text fontWeight="medium">{visitType?.toLowerCase().replace('_', ' ')}</Text>
                                    </Flex>
                                    <Flex justify="space-between" mb={1}>
                                        <Text>Patient:</Text>
                                        <Text fontWeight="medium">{firstName} {lastName}</Text>
                                    </Flex>
                                    <Flex justify="space-between" mb={1}>
                                        <Text>Slots:</Text>
                                        <Text fontWeight="medium">{slots}</Text>
                                    </Flex>
                                    <Separator my={2} />
                                    <Flex justify="space-between">
                                        <Text fontWeight="bold">Total:</Text>
                                        <Text fontWeight="bold" fontSize="lg" color="blue.600">{price * slots} PLN</Text>
                                    </Flex>
                                </Box>
                                
                                <Separator />
                                
                                <Text fontWeight="bold">Enter Payment Details (Mock)</Text>
                                <Input 
                                    placeholder="Card Number (0000 0000 0000 0000)" 
                                    value={cardNumber} 
                                    onChange={e => setCardNumber(e.target.value)} 
                                    maxLength={19}
                                />
                                <Flex gap={3}>
                                    <Input 
                                        placeholder="MM/YY" 
                                        width="50%" 
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        maxLength={5}
                                    />
                                    <Input 
                                        placeholder="CVV" 
                                        width="50%" 
                                        type="password" 
                                        maxLength={3} 
                                        value={cvv} 
                                        onChange={e => setCvv(e.target.value)}
                                    />
                                </Flex>
                                <Text fontSize="xs" color="gray.500">
                                    * This is a simulation. No real money will be charged.
                                </Text>
                            </Stack>
                        )}

                        {/* --- KROK 3: SPINNER --- */}
                        {currentStep === 'PROCESSING' && (
                            <Center flexDirection="column" py={10} gap={4}>
                                <Spinner size="xl" color="blue.500" />
                                <Text fontSize="lg" fontWeight="medium">Processing secure payment...</Text>
                                <Text color="gray.500">Please do not close this window.</Text>
                            </Center>
                        )}

                        {/* --- KROK 4: SUKCES --- */}
                        {currentStep === 'SUCCESS' && (
                            <Center flexDirection="column" py={5} gap={2}>
                                <Text fontSize="4xl">✅</Text>
                                <Text fontSize="xl" fontWeight="bold" color="green.600">Payment Successful!</Text>
                                <Text>Your appointment has been booked.</Text>
                            </Center>
                        )}
                    </DialogBody>

                    <DialogFooter gap={3}>
                        {currentStep === 'FORM' && (
                            <>
                                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                                <Button colorPalette="blue" onClick={handleProceedToPayment}>
                                    Go to Payment &gt;
                                </Button>
                            </>
                        )}
                        
                        {currentStep === 'PAYMENT' && (
                            <>
                                <Button variant="ghost" onClick={() => setCurrentStep('FORM')}>&lt; Back</Button>
                                <Button colorPalette="green" onClick={handlePayAndBook} disabled={!cardNumber || !cvv}>
                                    Pay {price * slots} PLN
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </DialogPositioner>
        </DialogRoot>
    );
};

export default ReservationModal;