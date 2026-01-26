import User from "./models/User";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./utils/config";

// PLIK DO TWORZENIA ADMINA Z POZIOMU KONSOLI "npm run create-admin"
export const createAdminIfNotExists = async () => {
	try {
		await connectToDatabase();
		
		const adminEmail = "admin@admin.com";
		const adminPassword = "adminadmin";

		// Sprawdź czy admin już istnieje
		const existingAdmin = await User.findOne({ email: adminEmail });
		
		if (existingAdmin) {
			console.log('Admin already exists');
			return;
		}


		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(adminPassword, salt);


		const admin = new User({
			email: adminEmail,
			password: hashedPassword,
			role: 'ADMIN',
			isBlocked: false
		});

		await admin.save();
		console.log('Admin created successfully');
		console.log('Email:', adminEmail);
		console.log('Password:', adminPassword);
		
	} catch (error) {
		console.error('Error creating admin:', error);
		throw error;
	}
};

if (require.main === module) {
	createAdminIfNotExists()
		.then(() => {
			console.log('Admin setup completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Admin setup failed:', error);
			process.exit(1);
		});
}
