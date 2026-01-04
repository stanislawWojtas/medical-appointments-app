import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where } from "firebase/firestore";
import type { Doctor } from "../models/Doctor";
import type { IDataProvider } from "./IDataProvider";
import { db } from "../firebaseConfig";
import type { Appointment, AppointmentType } from "../models/Appointment";
import { deleteDoc, writeBatch } from "firebase/firestore";
import type { Absence } from "../models/Absence";

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

	async addAvailability(newSlots: Appointment[]): Promise<void> {
		const batch = writeBatch(db);

		newSlots.forEach(slot => {
			const ref = doc(collection(db, "appointments"));
			batch.set(ref, {
				doctorId: slot.doctorId,
				date: slot.date,
				duration: slot.duration,
				status: "AVAILABLE",
				price: slot.price
			})
		})

		await batch.commit();
	}

	async removeAppointment(appointmentId: string): Promise<void> {
		const ref = doc(db, "appointments", appointmentId);
		await deleteDoc(ref);
	}

	// TODO: Przemyśl jakie id pacjenta ma być w appointment i dodaj potem
	async bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType): Promise<void> {
		
		// transaction żeby sprawdzić czy przypadkiem wizyta nie jest już zarezerwowana
		await runTransaction(db, async (transaction) => {
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
			})
		});
	}

	async getAbsences(doctorId: string): Promise<Absence[]> {
		const q = query(
			collection(db, "absences"),
			where("doctorId", "==", doctorId)
		)
		const snapshot = await getDocs(q);

		return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Absence));
	}


	async addAbsence(doctorId: string, startDate: Date, endDate: Date, reason?: string): Promise<void> {
		await addDoc(collection(db, "absences"), {
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
	}
}