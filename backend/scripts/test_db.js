const mongoose = require('mongoose');

const uri = 'mongodb+srv://arvindhada_11:arvind2006@hotelproject.cwibcyw.mongodb.net/librarywala';

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to DB!');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const libraries = await db.collection('libraries').find({}).toArray();
  console.log('Libraries count:', libraries.length);
  if (libraries.length > 0) {
    console.log('Sample Library:', {
      _id: libraries[0]._id,
      name: libraries[0].name,
      owner_id: libraries[0].owner_id
    });
  }
  
  const bookings = await db.collection('bookings').find({}).toArray();
  console.log('Bookings count:', bookings.length);
  
  const users = await db.collection('users').find({}).toArray();
  console.log('Users count:', users.length);
  if (users.length > 0) {
    console.log('Sample User:', {
      _id: users[0]._id,
      name: users[0].name,
      role: users[0].role,
      phone: users[0].phone
    });
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
