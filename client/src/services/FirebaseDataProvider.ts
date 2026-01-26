import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, where } from "firebase/firestore";
import type { Doctor } from "../models/Doctor";
import type { IDataProvider, Patient, DoctorWithReviews, RegisterDoctorPayload, LoginResponse, RegisterPayload } from "./IDataProvider";
import { db, auth, secondaryAuth } from "../firebaseConfig";
import type { Appointment, AppointmentType, PatientData } from "../models/Appointment";
import type { Review, ReviewStats, CreateReviewDto } from "../models/Review";
import { deleteDoc, writeBatch, setDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import type { Absence } from "../models/Absence";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// TODO: zamplementowac metody firebase
// klasa adapter do obsługi różnych backendów
export class FirebaseDataProvider implements IDataProvider {

	private async getCurrentUser() {
		return new Promise<any>((resolve, reject) => {
			const unsubscribe = onAuthStateChanged(auth, (user) => {
				unsubscribe();
				if (user) {
					resolve(user);
				} else {
					reject(new Error("User not authenticated"));
				}
			});
		});
	}

	// Auth methods
	async login(email: string, password: string): Promise<LoginResponse> {
		try {
			// Walidacja danych wejściowych
			if (!email || !password) {
				throw new Error("Email and password are required");
			}

			// Firebase Auth login
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const firebaseUser = userCredential.user;

			// Pobierz dane użytkownika z Firestore
			const userDocRef = doc(db, "users", firebaseUser.uid);
			const userDoc = await getDoc(userDocRef);

			if (!userDoc.exists()) {
				throw new Error("User data not found");
			}

			const userData = userDoc.data();

			// Sprawdź czy użytkownik nie jest zablokowany
			if (userData.isBlocked) {
				throw new Error("Your account has been blocked");
			}

			// Pobierz token
			const token = await firebaseUser.getIdToken();

			// Jeśli to lekarz, pobierz dane lekarza (doctorId = userId)
			let doctorData = null;
			if (userData.role === 'DOCTOR') {
				const doctorDocRef = doc(db, "doctors", firebaseUser.uid);
				const doctorDoc = await getDoc(doctorDocRef);
				if (doctorDoc.exists()) {
					doctorData = doctorDoc.data();
				}
			}

			return {
				token,
				user: {
					id: firebaseUser.uid,
					email: userData.email,
					role: userData.role,
					// Dla lekarza, doctorId = userId
					...(userData.role === 'DOCTOR' && { doctorId: firebaseUser.uid }),
					...(doctorData?.firstName && { firstName: doctorData.firstName }),
					...(doctorData?.lastName && { lastName: doctorData.lastName })
				}
			};
		} catch (error: any) {
			if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
				throw new Error("Invalid credentials");
			}
			throw error;
		}
	}

	async register(payload: RegisterPayload): Promise<void> {
		try {
			const { email, password } = payload;

			// Walidacja podstawowych danych
			if (!email || !password) {
				throw new Error("Email and password are required");
			}

			// Walidacja formatu email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Invalid email format");
			}

			if (password.length < 8) {
				throw new Error("Password must be at least 8 characters long");
			}

			// Utwórz użytkownika w Firebase Auth
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const firebaseUser = userCredential.user;

			// Publiczny endpoint rejestracji tworzy TYLKO pacjentów
			await setDoc(doc(db, "users", firebaseUser.uid), {
				email,
				role: 'PATIENT',
				isBlocked: false,
				createdAt: Timestamp.now()
			});

		} catch (error: any) {
			if (error.code === 'auth/email-already-in-use') {
				throw new Error(`User with email: ${payload.email} already exists`);
			}
			throw error;
		}
	}

	async getMyAppointments(): Promise<Appointment[]> {
		try {
			const user = await this.getCurrentUser();
			const userId = user.uid;

			// Automatyczna zmiana statusu BOOKED -> COMPLETED dla wizyt które już minęły
			const now = new Date();
			const q = query(
				collection(db, "appointments"),
				where("patientId", "==", userId),
				where("status", "in", ['BOOKED', 'COMPLETED', 'CANCELED'])
			);

			const snapshot = await getDocs(q);
			const batch = writeBatch(db);
			const appointmentsToUpdate: string[] = [];

			snapshot.docs.forEach(docSnapshot => {
				const apt = docSnapshot.data();
				const aptDate = new Date(apt.date);
				if (apt.status === 'BOOKED' && aptDate < now) {
					batch.update(doc(db, "appointments", docSnapshot.id), { status: 'COMPLETED' });
					appointmentsToUpdate.push(docSnapshot.id);
				}
			});

			if (appointmentsToUpdate.length > 0) {
				await batch.commit();
			}

			// Pobierz zaktualizowane wizyty
			const updatedSnapshot = await getDocs(q);
			const appointments: Appointment[] = [];

			for (const docSnapshot of updatedSnapshot.docs) {
				const apt = docSnapshot.data();
				
				// Pobierz dane lekarza
				let doctorData = null;
				if (apt.doctorId) {
					const doctorDoc = await getDoc(doc(db, "doctors", apt.doctorId));
					if (doctorDoc.exists()) {
						doctorData = doctorDoc.data();
					}
				}

				appointments.push({
					id: docSnapshot.id,
					doctorId: apt.doctorId,
					patientId: apt.patientId,
					date: apt.date,
					duration: apt.duration,
					price: apt.price,
					status: apt.status,
					type: apt.type,
					patientData: apt.patientData,
					cancelReason: apt.cancelReason,
					doctor: doctorData ? {
						firstName: doctorData.firstName,
						lastName: doctorData.lastName,
						specialization: doctorData.specialization
					} : undefined
				} as Appointment);
			}

			// Sortuj po dacie
			appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

			return appointments;
		} catch (error) {
			throw new Error(`Error fetching appointments: ${(error as Error).message}`);
		}
	}

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

	async bookAppointment(appointmentId: string, patientData: PatientData, visitType: AppointmentType, duration: number): Promise<Appointment> {
		
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

			// Pobierz ID zalogowanego pacjenta
			const user = await this.getCurrentUser();

			transaction.update(ref, {
				status: "BOOKED",
				patientId: user.uid,
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
				patientId: user.uid,
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

	async createReview(reviewData: CreateReviewDto): Promise<Review> {
		try {
			const user = await this.getCurrentUser();
			const patientId = user.uid;

			// Sprawdzenie czy użytkownik jest zablokowany
			const userDoc = await getDoc(doc(db, "users", patientId));
			if (!userDoc.exists()) {
				throw new Error("User not found");
			}

			if (userDoc.data().isBlocked) {
				throw new Error("You are blocked and cannot create reviews");
			}

			// sprawdzenie czy wizyta istnieje i należy do tego pacjenta
			const appointmentDoc = await getDoc(doc(db, "appointments", reviewData.appointmentId));
			if (!appointmentDoc.exists()) {
				throw new Error("Appointment not found");
			}

			const appointment = appointmentDoc.data();

			if (appointment.patientId !== patientId) {
				throw new Error("You can only review your own appointments");
			}

			// Sprawdzenie czy wizyta jest completed
			if (appointment.status !== 'COMPLETED') {
				throw new Error("You can only review completed appointments");
			}

			// sprawdzenie czy nie ma już review dla tej wizyty
			const existingReviewQuery = query(
				collection(db, "reviews"),
				where("appointmentId", "==", reviewData.appointmentId)
			);
			const existingReviewSnapshot = await getDocs(existingReviewQuery);
			if (!existingReviewSnapshot.empty) {
				throw new Error("You have already reviewed this appointment");
			}

			// Walidacja rating
			if (reviewData.rating < 1 || reviewData.rating > 5) {
				throw new Error("Rating must be between 1 and 5");
			}

			const reviewDoc = {
				doctorId: appointment.doctorId,
				patientId: patientId,
				appointmentId: reviewData.appointmentId,
				rating: reviewData.rating,
				comment: reviewData.comment,
				createdAt: Timestamp.now()
			};

			const docRef = await addDoc(collection(db, "reviews"), reviewDoc);

			return {
				_id: docRef.id,
				...reviewDoc,
				createdAt: new Date().toISOString()
			} as Review;
		} catch (error) {
			throw new Error(`Error creating review: ${(error as Error).message}`);
		}
	}

	async getReviewsByDoctor(doctorId: string): Promise<Review[]> {
		try {
			const q = query(
				collection(db, "reviews"),
				where("doctorId", "==", doctorId)
			);

			const snapshot = await getDocs(q);

			const reviews = snapshot.docs.map(doc => ({
				_id: doc.id,
				...doc.data()
			} as Review));

			// Sortuj lokalnie po createdAt
			reviews.sort((a, b) => {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateB - dateA;
			});

			return reviews;
		} catch (error) {
			throw new Error(`Error fetching reviews: ${(error as Error).message}`);
		}
	}

	async getReviewStats(doctorId: string): Promise<ReviewStats> {
		try {
			const q = query(
				collection(db, "reviews"),
				where("doctorId", "==", doctorId)
			);

			const snapshot = await getDocs(q);

			if (snapshot.empty) {
				return {
					averageRating: 0,
					totalReviews: 0,
					ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
				};
			}

			let totalRating = 0;
			const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

			snapshot.docs.forEach(doc => {
				const review = doc.data();
				totalRating += review.rating;
				distribution[review.rating] = (distribution[review.rating] || 0) + 1;
			});

			const averageRating = totalRating / snapshot.size;

			return {
				averageRating: Math.round(averageRating * 10) / 10,
				totalReviews: snapshot.size,
				ratingDistribution: distribution as { 1: number; 2: number; 3: number; 4: number; 5: number }
			};
		} catch (error) {
			throw new Error(`Error fetching review stats: ${(error as Error).message}`);
		}
	}

	async deleteReview(reviewId: string): Promise<void> {
		try {
			const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
			if (!reviewDoc.exists()) {
				throw new Error("Review not found");
			}

			await deleteDoc(doc(db, "reviews", reviewId));
		} catch (error) {
			throw new Error(`Error deleting review: ${(error as Error).message}`);
		}
	}

	// Admin operations
	async registerDoctor(payload: RegisterDoctorPayload): Promise<void> {
		try {
			const { email, password, firstName, lastName, specialization, pricePerVisit } = payload;

			// Walidacja podstawowych danych
			if (!email || !password || !firstName || !lastName || !specialization) {
				throw new Error("All fields are required for doctor registration");
			}

			// Walidacja formatu email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Invalid email format");
			}

			if (password.length < 8) {
				throw new Error("Password must be at least 8 characters long");
			}

			// Użyj secondaryAuth żeby nie wylogować admina
			const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
			const firebaseUser = userCredential.user;

			// Tworzymy użytkownika z rolą DOCTOR
			await setDoc(doc(db, "users", firebaseUser.uid), {
				email,
				role: 'DOCTOR',
				isBlocked: false,
				createdAt: Timestamp.now()
			});

			// Tworzymy profil lekarza z tym samym ID co użytkownik
			await setDoc(doc(db, "doctors", firebaseUser.uid), {
				firstName: firstName,
				lastName: lastName,
				specialization,
				pricePerVisit: pricePerVisit || 150,
				averageRating: 0,
				reviewCount: 0
			});

			// Wyloguj nowo utworzonego użytkownika z secondaryAuth
			await signOut(secondaryAuth);

		} catch (error: any) {
			if (error.code === 'auth/email-already-in-use') {
				throw new Error(`User with email: ${payload.email} already exists`);
			}
			throw error;
		}
	}

	async getAllPatients(): Promise<Patient[]> {
		try {
			const q = query(
				collection(db, "users"),
				where("role", "==", "PATIENT")
			);

			const snapshot = await getDocs(q);

			// Sortuj po dacie utworzenia po pobraniu
			const patients = snapshot.docs.map(doc => ({
				id: doc.id,
				email: doc.data().email,
				isBlocked: doc.data().isBlocked,
				createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
			} as Patient));

			// Sortuj lokalnie
			patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

			return patients;
		} catch (error) {
			throw new Error(`Error fetching patients: ${(error as Error).message}`);
		}
	}

	async blockUser(userId: string): Promise<void> {
		try {
			const userDoc = await getDoc(doc(db, "users", userId));
			if (!userDoc.exists()) {
				throw new Error("User not found");
			}

			if (userDoc.data().role === 'ADMIN') {
				throw new Error("Cannot block admin users");
			}

			await updateDoc(doc(db, "users", userId), {
				isBlocked: true
			});
		} catch (error) {
			throw new Error(`Error blocking user: ${(error as Error).message}`);
		}
	}

	async unblockUser(userId: string): Promise<void> {
		try {
			const userDoc = await getDoc(doc(db, "users", userId));
			if (!userDoc.exists()) {
				throw new Error("User not found");
			}

			await updateDoc(doc(db, "users", userId), {
				isBlocked: false
			});
		} catch (error) {
			throw new Error(`Error unblocking user: ${(error as Error).message}`);
		}
	}

	async getAllDoctorsWithReviews(): Promise<DoctorWithReviews[]> {
		try {
			// Pobierz wszystkich lekarzy
			const doctorsSnapshot = await getDocs(collection(db, "doctors"));
			
			// Dla każdego lekarza pobieramy jego komentarze
			const doctorsWithReviews: DoctorWithReviews[] = await Promise.all(
				doctorsSnapshot.docs.map(async (doctorDoc) => {
					const doctorData = doctorDoc.data();
					
					// Pobierz reviews dla tego lekarza
					const reviewsQuery = query(
						collection(db, "reviews"),
						where("doctorId", "==", doctorDoc.id)
					);
					
					const reviewsSnapshot = await getDocs(reviewsQuery);
					
					// Dla każdej recenzji pobierz email pacjenta
					const reviews: Review[] = await Promise.all(
						reviewsSnapshot.docs.map(async (reviewDoc) => {
							const reviewData = reviewDoc.data();
							
							let patientEmail = 'Anonymous';
							if (reviewData.patientId) {
								const patientDoc = await getDoc(doc(db, "users", reviewData.patientId));
								if (patientDoc.exists()) {
									patientEmail = patientDoc.data().email;
								}
							}
							
							return {
								_id: reviewDoc.id,
								doctorId: reviewData.doctorId,
								appointmentId: reviewData.appointmentId,
								rating: reviewData.rating,
								comment: reviewData.comment,
								createdAt: reviewData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
								patientId: { email: patientEmail } as any
							} as Review;
						})
					);

					// Sortuj reviews lokalnie po createdAt
					reviews.sort((a, b) => {
						const dateA = new Date(a.createdAt).getTime();
						const dateB = new Date(b.createdAt).getTime();
						return dateB - dateA;
					});
					
					return {
						id: doctorDoc.id,
						...doctorData,
						reviews: reviews
					} as DoctorWithReviews;
				})
			);

			return doctorsWithReviews;
		} catch (error) {
			throw new Error(`Error fetching doctors with reviews: ${(error as Error).message}`);
		}
	}

}