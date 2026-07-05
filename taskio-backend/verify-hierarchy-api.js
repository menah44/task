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

  // Helper to list groups and find by ID
  const getGroupsList = async () => {
    const res = await axios.get(`${baseURL}/groups`, { headers });
    return res.data;
  };

  console.log('\n2. Creating a root-level Group A...');
  const groupARes = await axios.post(`${baseURL}/groups`, { name: 'Group A ' + Date.now() }, { headers });
  const groupAId = groupARes.data.id;
  console.log('Created Group A ID:', groupAId);

  console.log('\n3. Creating Group B with parent Group A...');
  const groupBRes = await axios.post(`${baseURL}/groups`, { name: 'Group B ' + Date.now(), parentId: groupAId }, { headers });
  const groupBId = groupBRes.data.id;
  console.log('Created Group B ID:', groupBId, 'parentId:', groupBRes.data.parentId);

  if (groupBRes.data.parentId !== groupAId) {
    throw new Error('Group B parentId mismatch in response');
  }

  console.log('\n4. Verifying group B parentId in list...');
  const list = await getGroupsList();
  const foundB = list.find(g => g.id === groupBId);
  console.log('Found Group B in list:', foundB);
  if (!foundB || foundB.parentId !== groupAId) {
    throw new Error('Group B in list did not return correct parentId');
  }

  console.log('\n4.5. Verifying GET /groups/:groupId/children returns Group B...');
  const childrenRes = await axios.get(`${baseURL}/groups/${groupAId}/children`, { headers });
  console.log('Group A children:', childrenRes.data);
  if (childrenRes.data.length !== 1 || childrenRes.data[0].id !== groupBId) {
    throw new Error('Group A children list did not return Group B');
  }

  console.log('\n5. Creating Group C with parent Group B...');
  const groupCRes = await axios.post(`${baseURL}/groups`, { name: 'Group C ' + Date.now(), parentId: groupBId }, { headers });
  const groupCId = groupCRes.data.id;
  console.log('Created Group C ID:', groupCId, 'parentId:', groupCRes.data.parentId);

  console.log('\n6. Testing Circular Dependency Protection: Setting Group A parent to Group B (descendant)...');
  try {
    await axios.put(`${baseURL}/groups/${groupAId}`, { name: groupARes.data.name, parentId: groupBId }, { headers });
    throw new Error('Expected update to fail due to circular dependency, but it succeeded');
  } catch (err) {
    console.log('Update failed as expected! Status:', err.response.status, 'Message:', err.response.data.message);
    if (err.response.status !== 400 || !err.response.data.message.includes('Circular dependency')) {
      throw new Error('Expected 400 with Circular dependency message, got: ' + JSON.stringify(err.response.data));
    }
  }

  console.log('\n7. Testing Circular Dependency Protection: Moving Group A to parent Group C via drag-and-drop endpoint...');
  try {
    await axios.put(`${baseURL}/groups/${groupAId}/parent/${groupCId}`, {}, { headers });
    throw new Error('Expected re-parenting to fail, but it succeeded');
  } catch (err) {
    console.log('Re-parenting failed as expected! Status:', err.response.status, 'Message:', err.response.data.message);
    if (err.response.status !== 400 || !err.response.data.message.includes('Circular dependency')) {
      throw new Error('Expected 400 with Circular dependency message, got: ' + JSON.stringify(err.response.data));
    }
  }

  console.log('\n8. Re-parenting Group C to Group A (valid move)...');
  const moveRes = await axios.put(`${baseURL}/groups/${groupCId}/parent/${groupAId}`, {}, { headers });
  console.log('Move response:', moveRes.data);
  
  console.log('\n9. Verifying Group C parentId is updated to Group A...');
  const updatedList = await getGroupsList();
  const foundC = updatedList.find(g => g.id === groupCId);
  console.log('Found Group C in updated list:', foundC);
  if (!foundC || foundC.parentId !== groupAId) {
    throw new Error('Group C parentId was not updated to Group A');
  }

  console.log('\n10. Moving Group C to Root level...');
  await axios.put(`${baseURL}/groups/${groupCId}/parent/null`, {}, { headers });
  console.log('Moved Group C to root successfully');

  console.log('\n11. Verifying Group C has no parent (null)...');
  const finalList = await getGroupsList();
  const finalC = finalList.find(g => g.id === groupCId);
  console.log('Found Group C in final list:', finalC);
  if (!finalC || finalC.parentId !== null) {
    throw new Error('Group C parentId is not null after moving to root');
  }

  // Cleanup
  console.log('\n12. Cleaning up test groups...');
  await axios.delete(`${baseURL}/groups/${groupCId}`, { headers });
  await axios.delete(`${baseURL}/groups/${groupBId}`, { headers });
  await axios.delete(`${baseURL}/groups/${groupAId}`, { headers });
  console.log('Cleaned up successfully');

  console.log('\nAll Group Hierarchy API verifications passed successfully!');
}

verify().catch(err => {
  console.error('Verification failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
