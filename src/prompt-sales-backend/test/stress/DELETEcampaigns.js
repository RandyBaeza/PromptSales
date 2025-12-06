import http from 'k6/http';

export const options = {
  vus: 20,
  duration: '30s',
};

export default function () {
  const headers = { 'x-user-role': 'admin' };
  http.del('http://localhost:3000/campaigns/1', null, { headers });
}