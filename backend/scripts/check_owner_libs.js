const mongoose = require('mongoose');
require('dotenv').config();
const Library = require('./src/models/Library');
const User = require('./src/models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const owner = await User.findOne({ phone: '9876543210' });
        if (owner) {
            const libs = await Library.find({ owner_id: owner._id });
            console.log(`Owner ${owner.phone} has ${libs.length} libraries.`);
            libs.forEach(l => console.log(`- ${l.name} (${l._id})`));
        } else {
            console.log('Owner not found.');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
check();
