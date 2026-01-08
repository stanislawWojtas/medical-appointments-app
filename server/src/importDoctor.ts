import Doctor from "./models/Doctor"

export const importData = async () => {

	try{
		const res = await Doctor.insertOne({
			firstName: "Jan",
			lastName: "Kowalski",
			specialization: "CARDIOLOGIST",
			pricePerVisit: 150
		})
		console.log('Doctor created');
		console.log("ID of the doctor: ", res.id)
	}catch (error){
		console.error('Error: ', error)
		process.exit(1);
	}
}