
db.audit_logs.createIndex({ 
  "orgId": 1, 
  "userId": 1, 
  "timestamp": -1 
})


db.audit_logs.createIndex({ 
  "orgId": 1, 
  "action": 1, 
  "resourceType": 1 
})


db.audit_logs.createIndex({ 
  "timestamp": 1 
}, { 
  expireAfterSeconds: 7776000 
})