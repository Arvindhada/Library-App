const mongoose = require('mongoose');
const uri = 'mongodb+srv://arvindhada_11:arvind2006@hotelproject.cwibcyw.mongodb.net/librarywala';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  console.log('--- USERS ---');
  const users = await db.collection('users').find({}).toArray();
  for (const u of users) {
    const lib = await db.collection('libraries').findOne({ owner_id: u._id });
    console.log({
      userId: u._id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      hasLibrary: lib ? lib.name : 'No'
    });
  }

  console.log('\n--- LIBRARIES ---');
  const libraries = await db.collection('libraries').find({}).toArray();
  for (const l of libraries) {
    const owner = await db.collection('users').findOne({ _id: l.owner_id });
    const bookCount = await db.collection('bookings').countDocuments({ library: l._id });
    console.log({
      libId: l._id,
      name: l.name,
      owner: owner ? owner.phone : 'Unknown',
      bookingsCount: bookCount
    });
  }
  
  await mongoose.disconnect();
}
main().catch(console.error);
