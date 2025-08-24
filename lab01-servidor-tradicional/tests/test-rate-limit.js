// Salve como test-rate-limit.js
const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE0NmU2ODU4LTk3OTQtNGE1NS04YWRhLWFjNGEzNTNjZWM1NCIsImVtYWlsIjoidXNlckB5YWhvby5jb20iLCJ1c2VybmFtZSI6InRlc3RhYmxlcyIsImlhdCI6MTc1NjA3MzY3NCwiZXhwIjoxNzU2MTYwMDc0fQ.T3oQd548EVCPebQQzl3LwyR9xlKNcmThiwGrrKjUmrE'; // Troque pelo seu token válido

async function flood() {
  for (let i = 0; i < 1100; i++) {
    try {
      const res = await axios.get('http://localhost:3000/api/tasks?page=1&limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(i, res.status, res.data.success);
    } catch (err) {
      if (err.response) {
        console.log(i, err.response.status, err.response.data);
      } else {
        console.log(i, 'Erro de conexão');
      }
    }
  }
}

flood();