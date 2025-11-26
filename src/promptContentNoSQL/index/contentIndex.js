
db.content.createIndex({ 
  "orgId": 1, 
  "projectId": 1, 
  "status": 1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "type": 1, 
  "createdAt": -1 
})


db.content.createIndex({
  "title": "text",
  "tags": "text"
})


db.content.createIndex({ 
  "orgId": 1, 
  "status": 1, 
  "createdAt": 1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "platformOptimizations.platform": 1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "createdAt": 1, 
  "type": 1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "status": 1, 
  "platformOptimizations.status": 1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "performance.metrics.engagementRate": -1 
})


db.content.createIndex({ 
  "orgId": 1, 
  "tags": 1 
})


db.content.createIndex({ 
  "contentSetId": 1, 
  "orgId": 1 
})