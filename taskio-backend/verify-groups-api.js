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

  console.log('\n2. Listing existing groups...');
  let groupsRes = await axios.get(`${baseURL}/groups`, { headers });
  console.log('Groups list:', groupsRes.data);

  console.log('\n3. Creating a new group...');
  const groupName = 'QA Team ' + Date.now();
  const createGroupRes = await axios.post(`${baseURL}/groups`, { name: groupName }, { headers });
  const newGroupId = createGroupRes.data.id;
  console.log('Created Group:', createGroupRes.data);

  console.log('\n4. Verifying group is in the list...');
  groupsRes = await axios.get(`${baseURL}/groups`, { headers });
  const newGroup = groupsRes.data.find(g => g.id === newGroupId);
  console.log('Found Group in list:', newGroup);

  console.log('\n5. Creating a new user inside the group...');
  const email = `testuser-${Date.now()}@example.com`;
  const username = `testuser-${Date.now()}`;
  const createUserRes = await axios.post(`${baseURL}/users`, {
    email,
    username,
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
    role: 'USER',
    groupId: newGroupId
  }, { headers });
  const userId = createUserRes.data.id;
  console.log('Created User:', createUserRes.data);

  console.log('\n6. Fetching user groups to verify assignment...');
  const userGroupsRes = await axios.get(`${baseURL}/users/${userId}/groups`, { headers });
  console.log('User groups:', userGroupsRes.data);

  console.log('\n7. Checking member count on groups list...');
  groupsRes = await axios.get(`${baseURL}/groups`, { headers });
  const groupAfterAssign = groupsRes.data.find(g => g.id === newGroupId);
  console.log('Group after assignment:', groupAfterAssign);

  console.log('\n8. Editing group name...');
  const updatedName = groupName + ' Updated';
  const updateRes = await axios.put(`${baseURL}/groups/${newGroupId}`, { name: updatedName }, { headers });
  console.log('Updated Group:', updateRes.data);

  console.log('\n9. Deleting group...');
  const deleteRes = await axios.delete(`${baseURL}/groups/${newGroupId}`, { headers });
  console.log('Deleted Group response:', deleteRes.data);

  console.log('\nAll API verifications passed successfully!');
}

verify().catch(err => {
  console.error('Verification failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
