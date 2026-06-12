const mongoose = require('mongoose');
const uri = 'mongodb+srv://arvindhada_11:arvind2006@hotelproject.cwibcyw.mongodb.net/librarywala';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const libraries = await db.collection('libraries').find({}).toArray();
  for (const lib of libraries) {
    if (lib.owner_id) {
      const res = await db.collection('users').updateOne(
        { _id: lib.owner_id },
        { $set: { role: 'owner' } }
      );
      console.log(`Updated owner ${lib.owner_id} for library '${lib.name}': modifiedCount=${res.modifiedCount}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
