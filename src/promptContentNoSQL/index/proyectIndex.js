
db.projects.createIndex({ 
  "orgId": 1, 
  "status": 1 
})


db.projects.createIndex({ 
  "orgId": 1, 
  "name": "text" 
})


db.projects.createIndex({ 
  "orgId": 1, 
  "timeline.endDate": 1 
})


db.projects.createIndex({ 
  "orgId": 1, 
  "createdAt": -1,
  "campaignGoal": 1 
})


db.projects.createIndex({ 
  "orgId": 1, 
  "stats.totalContent": -1 
})