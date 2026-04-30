const mongoose = require('mongoose');
require('dotenv').config();
const Library = require('./src/models/Library');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');

const sendRequest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Get or create a test student
        let student = await User.findOne({ phone: '8888888888' });
        if (!student) {
            student = await User.create({
                phone: '8888888888',
                role: 'student',
                name: 'Test Student'
            });
        }

        // 2. Find "The Rajputana" library
        const lib = await Library.findOne({ name: /The Rajputana/i });
        if (!lib) {
            console.error('Library "The Rajputana" not found!');
            process.exit(1);
        }

        // 3. Create a booking request
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);

        const booking = await Booking.create({
            library: lib._id,
            student: student._id,
            startDate: today,
            endDate: nextMonth,
            shift: 'Full Day',
            status: 'Pending'
        });

        console.log(`SUCCESS: Request sent for student ${student.name} to library ${lib.name}`);
        console.log('Booking ID:', booking._id);
        process.exit();
    } catch (err) {
        console.error('Error sending request:', err);
        process.exit(1);
    }
};

sendRequest();
