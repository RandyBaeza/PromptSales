import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 50 },   // Calentamiento
    { duration: '40s', target: 200 },  // Carga alta
    { duration: '20s', target: 0 },    // Descenso
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],  // p95 < 400 ms o el test falla
    http_req_failed: ['rate<0.01'],    // <1% de errores permitido
  },
};

export default function () {
  const res = http.get('http://localhost:3000/campaigns');
  sleep(1);
}