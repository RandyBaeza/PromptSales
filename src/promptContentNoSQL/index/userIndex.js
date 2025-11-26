
db.users.createIndex({ "email": 1 }, { unique: true })


db.users.createIndex({ 
  "personalInfo.firstName": 1, 
  "personalInfo.lastName": 1 
})


db.users.createIndex({ "lastLogin": -1 })


db.users.createIndex({ 
  "professionalRole": 1, 
  "createdAt": -1 
})