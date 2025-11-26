
db.platforms.createIndex({ "name": 1 }, { unique: true })


db.platforms.createIndex({ "type": 1, "category": 1 })


db.platforms.createIndex({ "status": 1 })