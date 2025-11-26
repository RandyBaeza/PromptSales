
db.content_sets.createIndex({ 
  "orgId": 1, 
  "projectId": 1 
})


db.content_sets.createIndex({ 
  "orgId": 1, 
  "name": "text" 
})


db.content_sets.createIndex({ 
  "orgId": 1, 
  "status": 1, 
  "createdAt": -1 
})