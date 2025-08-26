const axios = require('axios');
const { performance } = require('perf_hooks');

// Substitua com 10 tokens JWT válidos e diferentes para cada usuário
const tokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUxZjJiN2YxLTViZjAtNDNlYi05N2NiLWZkZjM4ZWMxNDViNyIsImVtYWlsIjoidXNlcnRlc3RAZW1haWwuY29tIiwidXNlcm5hbWUiOiJQaGlsIiwiaWF0IjoxNzU2MTU5MDk1LCJleHAiOjE3NTYyNDU0OTV9.HchSGeUxz5hzT5f3OpCN85tsm2CiJCHVeg9pJxxysC0',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNmZGRiYmNmLWE1N2QtNDUxMS05MjNkLWFjMDBiNjgwYTIwNSIsImVtYWlsIjoidXNlcnRlc3QyQGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDIiLCJpYXQiOjE3NTYxNTkzMjEsImV4cCI6MTc1NjI0NTcyMX0.wadirxqWd0jVYdwowWun-WwMLPUOh5kf0dSbo6pqByQ',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ1OGI0ZDZlLWE3ZWYtNGE2YS1iOTA3LWIyMjc5MzRlN2I4MiIsImVtYWlsIjoidXNlcnRlc3QzQGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDMiLCJpYXQiOjE3NTYxNjI1NjQsImV4cCI6MTc1NjI0ODk2NH0.k2YiGd2Og6vBCx6kPvAP0hKxzKo45DBnvg4iDDL9y-I',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQzM2EwMzFmLTk3ZGItNDI0Zi1iYjFiLTA3NzZkMmVjZWNjOCIsImVtYWlsIjoidXNlcnRlc3Q0QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDQiLCJpYXQiOjE3NTYxNjI1NjUsImV4cCI6MTc1NjI0ODk2NX0.QOzSOzkhgGvJuhK06xWjtxM6LpD0E3MQLTEUXzj-Rvg',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRiNWU2MmVmLWNiYzItNGFiYi1iYmU5LTMzY2U0MDM1ODI2MyIsImVtYWlsIjoidXNlcnRlc3Q1QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDUiLCJpYXQiOjE3NTYxNjI1NjUsImV4cCI6MTc1NjI0ODk2NX0.e8uWTks8iHq05vBUuOTV6fRNuuyV2Zq_RQ4PGPzMNDc',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVlZDhiNmVkLTY3YWUtNGEwZC05OGRhLWViZjRlODYyYzJiMiIsImVtYWlsIjoidXNlcnRlc3Q2QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDYiLCJpYXQiOjE3NTYxNjI1NjUsImV4cCI6MTc1NjI0ODk2NX0.nZpPJL9KK18oM02REkccIO42aBYfPPHloxsphM-mZM0',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1YThmM2Y2LWUwYzItNGE4Yi04OTY2LWJmZWFiYWFjODBlZiIsImVtYWlsIjoidXNlcnRlc3Q3QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDciLCJpYXQiOjE3NTYxNjI1NjYsImV4cCI6MTc1NjI0ODk2Nn0.v7lyrYW9lpbP2wegMoS7nWTkB17-7YNEJhxvSRchrtM',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4NWJlYjg4LTQ5NjUtNGM4OC1iOGU1LWYzMDI0NmE4ZTU1MCIsImVtYWlsIjoidXNlcnRlc3Q4QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDgiLCJpYXQiOjE3NTYxNjI1NjYsImV4cCI6MTc1NjI0ODk2Nn0.dlwAUDJjbkYSqnhZ8El5fE-q3KOfSxX7_QP8-BRbqmM',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNGEzZDJiLWE3Y2YtNDRiYi05MzFlLWE3OWRhYjI4NDYwMSIsImVtYWlsIjoidXNlcnRlc3Q5QGVtYWlsLmNvbSIsInVzZXJuYW1lIjoiUGhpbDkiLCJpYXQiOjE3NTYxNjI1NjcsImV4cCI6MTc1NjI0ODk2N30.l4KSsKlXF7H4qe9OhMVW0V94BFiyd8QmDpBYZiM4pdI',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQxZGNlOGUyLWYzNDctNDY5NC04MWMyLTA0YmM1NmU3OGVkMCIsImVtYWlsIjoidXNlcnRlc3QxMEBlbWFpbC5jb20iLCJ1c2VybmFtZSI6IlBoaWwxMCIsImlhdCI6MTc1NjE2MjU2NywiZXhwIjoxNzU2MjQ4OTY3fQ.nMOm5E97dwbQcOJc6CEAV4fgoy1AhgewWQ7zRsE4j5U'
];

const totalRequestsPerUser = 250;
const stats = {}; // Armazena as métricas de cada usuário

async function floodUser(userIndex, token, totalRequests = 250) {
  let success = 0;
  let errors = 0;
  let lost = 0;
  let totalTime = 0;
  const statusCounts = {};

  for (let i = 0; i < totalRequests; i++) {
    const start = performance.now();
    try {
      const res = await axios.get('http://localhost:3000/api/tasks?page=1&limit=10', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000 // Timeout 5s para não travar
      });

      const elapsed = performance.now() - start;
      totalTime += elapsed;

      success++;
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    } catch (err) {
      const elapsed = performance.now() - start;
      totalTime += elapsed;

      if (err.response) {
        errors++;
        const code = err.response.status;
        statusCounts[code] = (statusCounts[code] || 0) + 1;
      } else {
        lost++;
      }
    }
  }

  const averageTime = totalTime / totalRequests;

  stats[`User ${userIndex}`] = {
    'Total Enviadas': totalRequests,
    'Sucesso': success,
    'Erros HTTP': errors,
    'Perdidas': lost,
    'Média ms': averageTime.toFixed(2),
    'Status HTTP': JSON.stringify(statusCounts)
  };
}

async function runFloodTest() {
  process.stdout.write('Teste em progresso...');

  const tasks = tokens.map((token, index) =>
    floodUser(index + 1, token, totalRequestsPerUser)
  );

  await Promise.all(tasks);

  // Ordena por usuário
  const sortedStatsEntries = Object.entries(stats)
    .sort((a, b) => {
      const numA = parseInt(a[0].split(' ')[1]);
      const numB = parseInt(b[0].split(' ')[1]);
      return numA - numB;
    });

  const sortedStats = Object.fromEntries(sortedStatsEntries);

  // Limpa a linha do "teste em progresso"
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);

  console.log('\n📊 Resultado do stress test:\n');
  console.table(sortedStats);
}

runFloodTest();