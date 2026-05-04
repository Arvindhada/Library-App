const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log("=== STARTING BACKEND TESTS ===\n");

  // 1. Health
  console.log("1. Checking Server Health...");
  const health = await request('GET', '/api/health');
  console.log(health.body);

  // 2. Login
  console.log("\n2. Sending OTP Request...");
  const phone = '9876543210';
  const login = await request('POST', '/api/auth/login', { phone });
  console.log(login.body);

  // 3. Verify OTP & Get Token
  console.log("\n3. Verifying OTP...");
  const verify = await request('POST', '/api/auth/verify-otp', { phone, otp: '1234' });
  console.log(verify.body);
  const token = verify.body.token;

  if (token) {
    console.log("\n-> ✅ Token received successfully!");

    // 4. Create Library
    console.log("\n4. Creating Dummy Library...");
    const libRes = await request('POST', '/api/libraries', {
      name: "Test Library",
      address: "123 Test St",
      total_seats: 50,
      available_seats: 50
    });
    const libId = libRes.body._id;
    console.log(`Created Library With ID: ${libId}`);

    // 5. Booking
    if(libId) {
       console.log("\n5. Creating Booking...");
       const bookRes = await request('POST', '/api/bookings', {
         libraryId: libId,
         startDate: new Date(),
         endDate: new Date(Date.now() + 86400000), // Next day
         shift: 'Morning'
       }, token);
       console.log(bookRes.body);

       // 6. View Bookings
       console.log("\n6. Fetching My Bookings...");
       const myBookings = await request('GET', '/api/bookings/me', null, token);
       console.log(`Number of bookings: ${myBookings.body.bookings.length}`);
       console.log(myBookings.body.bookings[0]);
    }

  } else {
    console.log("Failed to get token!");
  }

  console.log("\n=== TESTS COMPLETE ===");
}

runTests();
