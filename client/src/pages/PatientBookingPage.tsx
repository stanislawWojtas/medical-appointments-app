import { Box, Text } from "@chakra-ui/react";
import { useParams } from "react-router";
import DoctorCalendar from "../components/DoctorCalendar";
import type { Doctor } from "../models/Doctor";
import { useEffect, useState } from "react";
import { getAbsences, getDoctorById } from "../services/consultationService";
import type { Absence } from "../models/Absence";


const PatientBookingPage = () => {

	const params = useParams();
	const doctorId = params.doctorId as string;
	
	const [doctor, setDoctor] = useState<Doctor>()
	const [absences, setAbsences] = useState<Absence[]>([])

	useEffect( () => {
		const fetchDoctor = async () => {
			try{
				const data = await getDoctorById(doctorId) 
				setDoctor(data);
			}catch(error){
				console.log("Error occured during fetching doctor: ", error)
			}
		}
		const fetchAbsences = async () => {
			try{
				const data = await getAbsences(doctorId);
				setAbsences(data)
			}catch(error){
				console.log("Error fetching the data: ", error)
			}
		}
		fetchDoctor();
		fetchAbsences();
	}, [])
	


	return(
		<>
			<Box h={"100%"}>
				<Text p={0} fontWeight={'bold'} fontSize={'x-large'} letterSpacing={3} padding={3}>Dr. {doctor?.firstName} {doctor?.lastName} - {doctor?.specialization.toLowerCase()}</Text>
				<DoctorCalendar isDoctor={false} doctorId={doctorId} absences={absences}/>
			</Box>
		</>
	)
}

export default PatientBookingPage;