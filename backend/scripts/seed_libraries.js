const mongoose = require('mongoose');
require('dotenv').config();
const Library = require('./src/models/Library');
const User = require('./src/models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find test owner
        let owner = await User.findOne({ phone: '9876543210' });
        
        if (!owner) {
            console.log('Test owner not found, creating one...');
            owner = await User.create({
                phone: '9876543210',
                role: 'owner',
                name: 'Test Owner'
            });
        }

        const dummyLibraries = [
            {
                name: 'The Knowledge Hub',
                address: '123 Study Lane, Jaipur',
                total_seats: 50,
                available_seats: 45,
                ac_available: true,
                wifi_available: true,
                area: 'Mansarovar',
                half_time_fee: 500,
                full_time_fee: 900,
                owner_id: owner._id
            },
            {
                name: 'Elite Study Center',
                address: '45 Exam Street, Jaipur',
                total_seats: 30,
                available_seats: 10,
                ac_available: true,
                wifi_available: true,
                area: 'Malviya Nagar',
                half_time_fee: 600,
                full_time_fee: 1100,
                owner_id: owner._id
            },
            {
                name: 'Peaceful Reading Room',
                address: '78 Silence Road, Jaipur',
                total_seats: 40,
                available_seats: 38,
                ac_available: false,
                wifi_available: true,
                area: 'Vaishali Nagar',
                half_time_fee: 400,
                full_time_fee: 700,
                owner_id: owner._id
            },
            {
                name: 'Success Point Library',
                address: '90 Achievement Blvd, Jaipur',
                total_seats: 100,
                available_seats: 25,
                ac_available: true,
                wifi_available: false,
                area: 'Tonk Road',
                half_time_fee: 550,
                full_time_fee: 1000,
                owner_id: owner._id
            }
        ];

        await Library.deleteMany({ owner_id: owner._id }); // Clear existing for this owner to avoid duplicates
        await Library.insertMany(dummyLibraries);

        console.log('Successfully added 4 dummy libraries!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
