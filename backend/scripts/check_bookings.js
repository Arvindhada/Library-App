const mongoose = require('mongoose');
const uri = 'mongodb+srv://arvindhada_11:arvind2006@hotelproject.cwibcyw.mongodb.net/librarywala';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const bookings = await db.collection('bookings').find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log('Last 5 Bookings:');
  for (const b of bookings) {
    const student = await db.collection('users').findOne({ _id: b.student });
    console.log({
      _id: b._id,
      studentName: student ? student.name : 'Unknown',
      studentPhone: student ? student.phone : 'Unknown',
      seat: b.seat,
      status: b.status,
      library: b.library,
      createdAt: b.createdAt
    });
  }
  
  await mongoose.disconnect();
}
main().catch(console.error);
