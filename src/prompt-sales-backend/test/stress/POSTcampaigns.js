import http from 'k6/http';

export const options = {
  vus: 30,           // 30 usuarios virtuales
  duration: '45s',   // por 45 segundos
};

export default function () {
  const payload = JSON.stringify({
    name: `StressTest-${Math.random()}`,
    budget: 1000,
    startDate: "2025-01-01",
    endDate: "2025-01-31"
  });

  const headers = { 'Content-Type': 'application/json' };

  http.post('http://localhost:3000/campaigns', payload, { headers });
}