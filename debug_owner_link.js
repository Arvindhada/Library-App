const mongoose = require('mongoose');
require('dotenv').config();
const Library = require('./src/models/Library');
const User = require('./src/models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ phone: '9876543210' });
        const lib = await Library.findOne({ owner_id: user._id });
        console.log('User ID:', user._id);
        console.log('Library linked to User ID:', lib ? lib._id : 'NONE');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
check();
