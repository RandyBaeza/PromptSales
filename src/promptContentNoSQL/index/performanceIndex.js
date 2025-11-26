
db.performance_metrics.createIndex({ 
  "orgId": 1, 
  "date": -1 
})


db.performance_metrics.createIndex({ 
  "orgId": 1, 
  "contentId": 1, 
  "date": 1 
})

db.performance_metrics.createIndex({ 
  "orgId": 1, 
  "platform": 1, 
  "date": -1 
})


db.performance_metrics.createIndex({ 
  "date": 1 
}, { 
  expireAfterSeconds: 2592000 
})