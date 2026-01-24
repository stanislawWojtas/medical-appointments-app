import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, where } from "firebase/firestore";
import type { Doctor } from "../models/Doctor";
import type { IDataProvider } from "./IDataProvider";
import { db } from "../firebaseConfig";
import type { Appointment, AppointmentType } from "../models/Appointment";
import { deleteDoc, writeBatch } from "firebase/firestore";
import type { Absence } from "../models/Absence";
import { DataListItem } from "@chakra-ui/react";

// klasa adapter do obsługi różnych backendów
export class FirebaseDataProvider implements IDataProvider {

	async getDoctors(): Promise<Doctor[]> {
		const ref = collection(db, "doctors");
		const snapshot = await getDocs(ref);

		return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Doctor);
	}

	async getDoctorById(id: string): Promise<Doctor | undefined> {
		const ref = doc(db, "doctors", id);
		const snapshot = await getDoc(ref);
		if(!snapshot.exists()){
			return undefined;
		}
		return {id: snapshot.id, ...snapshot.data()} as Doctor;
	}

	async getAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
		const q = query(
			collection(db, "appointments"),
			where("doctorId", "==", doctorId),
			where("date", ">=", startDate.toISOString()),
			where("date", "<=", endDate.toISOString())
		)

		const snapshot = await getDocs(q);

		return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Appointment);
	}

	async addAvailability(newSlots: Appointment[]): Promise<Appointment[]> {
		const batch = writeBatch(db);
		const refs: any[] = [];

		newSlots.forEach(slot => {
			const ref = doc(collection(db, "appointments"));
			refs.push(ref);
			batch.set(ref, {
				doctorId: slot.doctorId,
				date: slot.date,
				duration: slot.duration,
				status: "AVAILABLE",
				price: slot.price
			})
		})

		await batch.commit();

		// Pobierz utworzone dokumenty
		const createdAppointments: Appointment[] = await Promise.all(
			refs.map(async (ref) => {
				const snapshot = await getDoc(ref);
				if (!snapshot.exists()) {
					throw new Error("Failed to retrieve created appointment");
				}
				const data = snapshot.data() as Record<string, any>;
				return { id: snapshot.id, ...data } as Appointment;
			})
		);

		return createdAppointments;
	}

	async removeAppointment(appointmentId: string): Promise<void> {
		const ref = doc(db, "appointments", appointmentId);
		await deleteDoc(ref);
	}

	// TODO: Przemyśl jakie id pacjenta ma być w appointment i dodaj potem
	async bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType, duration: number): Promise<Appointment> {
		
		// transaction żeby sprawdzić czy przypadkiem wizyta nie jest już zarezerwowana
		const updatedAppointment = await runTransaction(db, async (transaction) => {
			const ref = doc(db, "appointments", appointmentId);
			const snapshot = await transaction.get(ref);
			if(!snapshot.exists()){
				throw new Error("Appointment does not exist");
			}
			const appointment = snapshot.data() as Appointment;
			if(appointment.status !== "AVAILABLE" || appointment.patientData !== undefined){
				throw new Error("Appointment is not available");
			}

			transaction.update(ref, {
				status: "BOOKED",
				patientData: patientData,
				type: visitType
			});

			return {
				...appointment,
				id: appointmentId,
				status: "BOOKED",
				patientData: patientData,
				type: visitType
			} as Appointment;
		});

		return updatedAppointment;
	}

	async getAbsences(doctorId: string): Promise<Absence[]> {
		const q = query(
			collection(db, "absences"),
			where("doctorId", "==", doctorId)
		)
		const snapshot = await getDocs(q);

		return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Absence));
	}


	async addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<Absence> {
		const docRef = await addDoc(collection(db, "absences"), {
			doctorId,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			reason
		})

		// pobranie appointments
		const appointments = await this.getAppointments(doctorId, startDate, endDate);
		const batch = writeBatch(db);
		appointments.forEach(appointment => {
			const ref = doc(db, "appointments", appointment.id);
			if(appointment.status === "AVAILABLE"){
				batch.delete(ref);
			}else if(appointment.status === "BOOKED"){
				batch.update(ref, {status: "CANCELED"} );
			}
		})
		await batch.commit();

		// Zwracamy utworzony absence
		const snapshot = await getDoc(docRef);
		if (!snapshot.exists()) {
			throw new Error("Failed to retrieve created absence");
		}
		const data = snapshot.data() as Record<string, any>;
		return { id: snapshot.id, ...data } as Absence;
	}

	// // funkcja pomocnicza do sprawdzenia czy nie ma kolizji między terminami
	// async checkCollision(date: Date, duration: number){
	// 	const newEnd = this.getEndDate(date, duration);
	// }

	// getEndDate(date: Date, duration: number){
	// 	return new Date(date.getTime() + duration * 30 * 60000);
	// }
}