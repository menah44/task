const axios = require('axios');

async function verify() {
  const baseURL = 'http://localhost:3002';
  
  console.log('1. Authenticating...');
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    email: 'admin@taskio.com',
    password: '123456'
  });
  const token = loginRes.data.accessToken;
  console.log('Authenticated successfully!');

  const headers = { Authorization: `Bearer ${token}` };

  console.log('\n2. Fetching default audit logs...');
  const defaultRes = await axios.get(`${baseURL}/audit`, { headers });
  const total = defaultRes.data.total;
  console.log(`Total logs in system: ${total}`);
  if (!Array.isArray(defaultRes.data.items) || defaultRes.data.items.length === 0) {
    throw new Error('Expected items array containing seeded logs');
  }
  const firstLog = defaultRes.data.items[0];
  console.log('First log item:', {
    id: firstLog.id,
    actorEmail: firstLog.actorEmail,
    action: firstLog.action,
    resourceType: firstLog.resourceType,
    createdAt: firstLog.createdAt,
  });

  console.log('\n3. Testing Pagination: Page 2, Limit 5...');
  const paginatedRes = await axios.get(`${baseURL}/audit`, {
    params: { page: 2, limit: 5 },
    headers
  });
  console.log(`Returned page: ${paginatedRes.data.page}, limit: ${paginatedRes.data.limit}, item count: ${paginatedRes.data.items.length}`);
  if (paginatedRes.data.items.length !== 5 || paginatedRes.data.page !== 2) {
    throw new Error('Pagination limit or page parameter failed');
  }

  console.log('\n4. Testing Filter: Resource Type = USER...');
  const userFilterRes = await axios.get(`${baseURL}/audit`, {
    params: { resourceType: 'USER' },
    headers
  });
  const allUserType = userFilterRes.data.items.every(item => item.resourceType === 'USER');
  console.log(`Items match resourceType USER: ${allUserType} (count: ${userFilterRes.data.items.length})`);
  if (!allUserType) {
    throw new Error('Resource filter returned mismatched item types');
  }

  console.log('\n5. Testing Filter: Actor ID = 1...');
  const actorFilterRes = await axios.get(`${baseURL}/audit`, {
    params: { actorId: 1 },
    headers
  });
  const allActorId1 = actorFilterRes.data.items.every(item => item.actorId === 1);
  console.log(`Items match actorId 1: ${allActorId1} (count: ${actorFilterRes.data.items.length})`);
  if (!allActorId1) {
    throw new Error('Actor filter returned mismatched actor entries');
  }

  console.log('\n6. Testing Filter: Date Range (last 10 years to next year)...');
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 10);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const dateFilterRes = await axios.get(`${baseURL}/audit`, {
    params: {
      startDate: pastDate.toISOString().split('T')[0],
      endDate: futureDate.toISOString().split('T')[0]
    },
    headers
  });
  console.log(`Logs within date range filter count: ${dateFilterRes.data.items.length}`);
  if (dateFilterRes.data.items.length === 0) {
    throw new Error('Expected logs inside date range, got zero');
  }

  console.log('\n7. Fetching detailed audit log by ID...');
  const logId = firstLog.id;
  const detailRes = await axios.get(`${baseURL}/audit/${logId}`, { headers });
  console.log('Detail response attributes loaded successfully:', {
    id: detailRes.data.id,
    ipAddress: detailRes.data.ipAddress,
    userAgent: detailRes.data.userAgent,
    details: detailRes.data.details ? 'JSON Present' : 'Missing',
  });
  if (detailRes.data.id !== logId) {
    throw new Error('Detail endpoint did not return correct log by ID');
  }

  console.log('\nAll Audit Logs API verifications passed successfully!');
}

verify().catch(err => {
  console.error('Verification failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
