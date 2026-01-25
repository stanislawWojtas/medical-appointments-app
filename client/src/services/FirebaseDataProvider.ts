import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, where } from "firebase/firestore";
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

	async bookAppointment(appointmentId: string, patientData: any, visitType: AppointmentType, duration: number): Promise<Appointment> {
		
		// transaction żeby sprawdzić czy przypadkiem wizyta nie jest już zarezerwowana
		const updatedAppointment = await runTransaction(db, async (transaction) => {
			const ref = doc(db, "appointments", appointmentId);
			const snapshot = await transaction.get(ref);
			if(!snapshot.exists()){
				throw new Error("Appointment does not exist");
			}
			const mainSlot = snapshot.data() as Appointment;
			if(mainSlot.status !== "AVAILABLE" || mainSlot.patientData !== undefined){
				throw new Error("Appointment is not available");
			}

			// Mechanizm blokowania slotów gdy duration > 1
			const slotsToBlock: Array<{ref: any, slot: Appointment}> = [];
			if(duration > 1){
				for(let i = 1; i < duration; i++){
					const nextTime = new Date(new Date(mainSlot.date).getTime() + i * 30 * 60000);
					
					const q = query(
						collection(db, "appointments"),
						where("doctorId", "==", mainSlot.doctorId),
						where("date", "==", nextTime.toISOString()),
						where("status", "==", "AVAILABLE")
					);
					
					const querySnapshot = await getDocs(q);
					if(querySnapshot.empty){
						throw new Error(`Cannot book appointment. Slot at ${nextTime.toLocaleString('pl-PL')} is not available`);
					}
					
					const nextSlotDoc = querySnapshot.docs[0];
					slotsToBlock.push({
						ref: doc(db, "appointments", nextSlotDoc.id),
						slot: {id: nextSlotDoc.id, ...nextSlotDoc.data()} as Appointment
					});
				}
			}

			transaction.update(ref, {
				status: "BOOKED",
				patientData: patientData,
				type: visitType,
				duration: duration
			});

			slotsToBlock.forEach(({ref}) => {
				transaction.update(ref, {
					status: "BLOCKED"
				});
			});

			return {
				...mainSlot,
				id: appointmentId,
				status: "BOOKED",
				patientData: patientData,
				type: visitType,
				duration: duration
			} as Appointment;
		});

		return updatedAppointment;
	}

	async cancelAppointmentByDoctor(appointmentId: string, reason?: string): Promise<Appointment> {
		return await runTransaction(db, async (transaction) => {
			const ref = doc(db, "appointments", appointmentId);
			const snapshot = await transaction.get(ref);
			
			if (!snapshot.exists()) {
				throw new Error("Appointment not found");
			}
			
			const mainSlot = snapshot.data() as Appointment;
			
			if (mainSlot.status !== "BOOKED") {
				throw new Error("Only booked appointments can be canceled");
			}
			
			// Anuluj główny slot
			transaction.update(ref, {
				status: "CANCELED",
				cancelReason: reason || null
			});
			
			// Znajdź i anuluj zablokowane sloty
			if (mainSlot.duration > 1) {
				for (let i = 1; i < mainSlot.duration; i++) {
					const nextTime = new Date(new Date(mainSlot.date).getTime() + i * 30 * 60000);
					
					const q = query(
						collection(db, "appointments"),
						where("doctorId", "==", mainSlot.doctorId),
						where("date", "==", nextTime.toISOString()),
						where("status", "==", "BLOCKED")
					);
					
					const querySnapshot = await getDocs(q);
					if (!querySnapshot.empty) {
						const blockedRef = doc(db, "appointments", querySnapshot.docs[0].id);
						transaction.update(blockedRef, { status: "CANCELED" });
					}
				}
			}
			
			return {
				...mainSlot,
				id: appointmentId,
				status: "CANCELED",
				cancelReason: reason
			} as Appointment;
		});
	}

	async cancelAppointmentByPatient(appointmentId: string): Promise<Appointment> {
		return await runTransaction(db, async (transaction) => {
			const ref = doc(db, "appointments", appointmentId);
			const snapshot = await transaction.get(ref);
			
			if (!snapshot.exists()) {
				throw new Error("Appointment not found");
			}
			
			const mainSlot = snapshot.data() as Appointment;
			
			if (mainSlot.status !== "BOOKED") {
				throw new Error("Only booked appointments can be canceled");
			}
			
			const duration = mainSlot.duration;
			
			// Zwolnij główny slot
			transaction.update(ref, {
				status: "AVAILABLE",
				patientData: null,
				type: null,
				duration: 1
			});
			
			// Znajdź i zwolnij zablokowane sloty
			if (duration > 1) {
				for (let i = 1; i < duration; i++) {
					const nextTime = new Date(new Date(mainSlot.date).getTime() + i * 30 * 60000);
					
					const q = query(
						collection(db, "appointments"),
						where("doctorId", "==", mainSlot.doctorId),
						where("date", "==", nextTime.toISOString()),
						where("status", "==", "BLOCKED")
					);
					
					const querySnapshot = await getDocs(q);
					if (!querySnapshot.empty) {
						const blockedRef = doc(db, "appointments", querySnapshot.docs[0].id);
						transaction.update(blockedRef, { status: "AVAILABLE" });
					}
				}
			}
			
			return {
				...mainSlot,
				id: appointmentId,
				status: "AVAILABLE",
				patientData: undefined,
				type: undefined,
				duration: 1
			} as Appointment;
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

	async removeAbsence(absenceId: string): Promise<void> {
		const absenceRef = doc(db, "absences", absenceId);
		const absenceSnapshot = await getDoc(absenceRef);
		
		if (!absenceSnapshot.exists()) {
			throw new Error("Absence not found");
		}
		
		const absence = absenceSnapshot.data() as Absence;
		
		const q = query(
			collection(db, "appointments"),
			where("doctorId", "==", absence.doctorId),
			where("date", ">=", absence.startDate),
			where("date", "<=", absence.endDate)
		);
		
		const appointmentsSnapshot = await getDocs(q);
		
		const batch = writeBatch(db);
		appointmentsSnapshot.docs.forEach(doc => {
			batch.delete(doc.ref);
		});
		

		batch.delete(absenceRef);
		
		await batch.commit();
	}

}