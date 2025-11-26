
db.organizations.createIndex({ "users.email": 1 })


db.organizations.createIndex({ "name": 1 })


db.organizations.createIndex({ 
  "subscription.status": 1, 
  "subscription.tier": 1 
})


db.organizations.createIndex({ 
  "createdAt": 1 
}, { 
  expireAfterSeconds: 7776000 
})