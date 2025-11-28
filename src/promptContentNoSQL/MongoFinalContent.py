"""
Script para crear todas las colecciones de MongoDB para PromptContent
Incluye validaciones de esquema y creación de índices
"""

from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import CollectionInvalid
import sys

# ============================================
# CONFIGURACIÓN DE CONEXIÓN
# ============================================
MONGO_URL = "mongodb://mongouser:mongo123@localhost:30017/promptcontent?authSource=admin"
DATABASE_NAME = "promptcontent"

def create_database_and_collections():
    """Crea la base de datos y todas las colecciones con sus validaciones"""
    
    try:
        # Conectar a MongoDB
        client = MongoClient(MONGO_URL)
        db = client[DATABASE_NAME]
        
        print(f"Conectado a MongoDB")
        print(f"Base de datos: {DATABASE_NAME}")
        print("-" * 60)
        
        # ============================================
        # 1. COLECCIÓN: PCUsers
        # ============================================
        try:
            db.create_collection("PCUsers", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["userId", "email", "role"],
                    "properties": {
                        "userId": {"bsonType": "string"},
                        "email": {"bsonType": "string"},
                        "name": {"bsonType": "string"},
                        "role": {"bsonType": "string", "enum": ["admin", "marketer", "agent", "client"]},
                        "passwordHash": {"bsonType": "string"}, 
                        "authMethod": {"bsonType": "string", "enum": ["local", "oauth_google", "oauth_microsoft", "sso"]},
                        "lastPasswordChange": {"bsonType": "date"},
                        "twoFactorEnabled": {"bsonType": "bool"},
                        "createdAt": {"bsonType": "date"},
                        "lastLogin": {"bsonType": "date"},  
                        "status": {"bsonType": "string", "enum": ["active", "inactive", "suspended"]}
                    }
                }
            })
            print("Colección 'PCUsers' creada")
        except CollectionInvalid:       
            print("Colección 'PCUsers' ya existe")
        
        # ÍNDICES
        # SIRVEN PARA MEJORAR EL TIEMPO DE CONSULTA DE ALGUNOS VALORES Y
        # PARA ASEGURARSE DE QUE LOS VALORES QUE DEBEN SER ÚNICOS EN LA BD, NO SE REPITAN 
        db.PCUsers.create_index([("userId", ASCENDING)], unique=True)
        db.PCUsers.create_index([("email", ASCENDING)], unique=True)
        db.PCUsers.create_index([("role", ASCENDING)])
        print("  → Índices creados para 'PCUsers'")
        
        # ============================================
        # 2. COLECCIÓN: PCExternal_Services
        # ============================================
        try:
            db.create_collection("PCExternal_Services", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["serviceId","name", "configuration"],
                    "properties": {
                        "serviceId": {"bsonType": "string"},
                        "name": {"bsonType": "string"},
                        "baseUrl": {"bsonType": "string"},
                        "authMethod": {"bsonType": "string"},
                        "encryptedCredentials": {"bsonType": "string"},
                        "secretKey": {"bsonType": "string"},
                        "apiKey": {"bsonType": "string"},
                        "status": {"bsonType": "string", "enum": ["active", "inactive", "testing"]},
                        "lastTestedAt": {"bsonType": "date"},
                        "createdAt": {"bsonType": "date"},
                        "updatedAt": {"bsonType": "date"},
                        "configuration": {  
                                            "bsonType": "object"
                                        }
                    },
                }
            })
            print("Colección 'PCExternal_Services' creada")
        except CollectionInvalid:
            print("Colección 'PCExternal_Services' ya existe")
        
        # ÍNDICES
        db.PCExternal_Services.create_index([("serviceId", ASCENDING)], unique=True)
        db.PCExternal_Services.create_index([("name", ASCENDING)])
        print("  → Índices creados para 'PCExternal_Services'")
        
        # ============================================
        # 3. COLECCIÓN: PCApi_Call_Logs
        # ============================================
        try:
            db.create_collection("PCApi_Call_Logs", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["logId", "serviceId"],
                    "properties": {
                        "logId": {"bsonType": "string"},
                        "serviceId": {"bsonType": "string"},
                        "endpoint": {"bsonType": "string"},
                        "method": {"bsonType": "string"},
                        "request": {"bsonType": "object"},
                        "response": {"bsonType": "object"},
                        "statusCode": {"bsonType": "int"},
                        "responseTime": {"bsonType": "int"},
                        "result": {"bsonType": "string"},
                        "userId": {"bsonType": "string"},
                        "platform": {"bsonType": "string"},
                        "ipAddress": {"bsonType": "string"},
                        "processType": {"bsonType": "string"},
                        "timestamp": {"bsonType": "date"},
                        "processedAt": {"bsonType": "date"},
                        "errorDetails": {"bsonType": "string"}
                    }
                }
            })
            print("Colección 'PCApi_Call_Logs' creada")
        except CollectionInvalid:
            print("Colección 'PCApi_Call_Logs' ya existe")
        
        # ÍNDICES
        db.PCApi_Call_Logs.create_index([("logId", ASCENDING)], unique=True)
        db.PCApi_Call_Logs.create_index([("serviceId", ASCENDING)])
        db.PCApi_Call_Logs.create_index([("timestamp", DESCENDING)])
        db.PCApi_Call_Logs.create_index([("userId", ASCENDING)])
        print("  → Índices creados para 'PCApi_Call_Logs'")
        
        # ============================================
        # 4. COLECCIÓN: PCAi_Models_Catalog
        # ============================================
        try:
            db.create_collection("PCAi_Models_Catalog", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["modelId", "provider", "modelEndpoint"],
                    "properties": {
                        "modelId": {"bsonType": "string"},
                        "name": {"bsonType": "string"},
                        "description": {"bsonType": "string"},
                        "provider": {
                            "bsonType": "string",
                            "enum": ["openai", "anthropic", "google", "huggingface", "aws_bedrock", "azure_openai", "custom"]},
                        "baseModel": {"bsonType": "string"},
                        "modelEndpoint": {"bsonType": "string"},
                        "isFineTuned": {"bsonType": "bool"},
                        "fineTunedModelId": {"bsonType": "string"},
                        "fineTunedAt": {"bsonType": "date"},
                        "status": {"bsonType": "string", "enum": ["active", "inactive", "testing"]},
                        "createdAt": {"bsonType": "date"},
                        "updatedAt": {"bsonType": "date"}
                    }
                }
            })
            print("Colección 'PCAi_Models_Catalog' creada")
        except CollectionInvalid:
            print("Colección 'PCAi_Models_Catalog' ya existe")
        
        # ÍNDICES
        db.PCAi_Models_Catalog.create_index([("modelId", ASCENDING)], unique=True)
        db.PCAi_Models_Catalog.create_index([("name", ASCENDING)])
        print("  → Índices creados para 'PCAi_Models_Catalog'")
        
        # ============================================
        # 5. COLECCIÓN: PCAi_Model_Logs
        # ============================================
        try:
            db.create_collection("PCAi_Model_Logs", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["logId", "modelId", "userId"],
                    "properties": {
                        "logId": {"bsonType": "string"},
                        "modelId": {"bsonType": "string"},
                        "versionId": {"bsonType": "string"},
                        "input": {"bsonType": "string"},
                        "output": {"bsonType": "object"},
                        "parameters": {"bsonType": "object"},
                        "userId": {"bsonType": "string"},
                        "ipAddress": {"bsonType": "string"},
                        "processType": {"bsonType": "string"},
                        "timestamp": {"bsonType": "date"},
                        "processingTime": {"bsonType": "int"},
                        "status": {"bsonType": "string"},
                        "mcpServerUsed": {"bsonType": "bool"},
                        "mcpServerName": {"bsonType": "string"}
                    }
                }
            })
            print("Colección 'PCAi_Model_Logs' creada")
        except CollectionInvalid:
            print("Colección 'PCAi_Model_Logs' ya existe")
        
        # ÍNDICES
        db.PCAi_Model_Logs.create_index([("logId", ASCENDING)], unique=True)
        db.PCAi_Model_Logs.create_index([("modelId", ASCENDING)])
        db.PCAi_Model_Logs.create_index([("timestamp", DESCENDING)])
        print("  → Índices creados para 'PCAi_Model_Logs'")
        
        # ============================================
        # 6. COLECCIÓN: PCContent_Types
        # ============================================
        try:
            db.create_collection("PCContent_Types", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["contentTypeId"],
                    "properties": {
                        "contentTypeId": {"bsonType": "string"},
                        "name": {"bsonType": "string", "enum": ["text", "image", "video", "audio", "carousel", "story"]},
                        "description": {"bsonType": "string"},
                        "supportedPlatforms": {"bsonType": "array"},
                        "createdAt": {"bsonType": "date"}
                    }
                }
            })
            print("Colección 'PCContent_Types' creada")
        except CollectionInvalid:
            print("Colección 'PCContent_Types' ya existe")
        
        # ÍNDICES
        db.PCContent_Types.create_index([("contentTypeId", ASCENDING)], unique=True)
        db.PCContent_Types.create_index([("name", ASCENDING)])
        print("  → Índices creados para 'PCContent_Types'")
        
        # ============================================
        # 7. COLECCIÓN: PCmedia
        # ============================================
        try:
            db.create_collection("PCmedia", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["clientId", "format"],
                    "properties": {
                        "mediaId": {"bsonType": "string"},
                        "mediaUrl": {"bsonType": "string"},
                        "fileName": {"bsonType": "string"},
                        "format": {"bsonType": "string"},
                        "size": {"bsonType": "int"},
                        
                        
                         # STORAGE EN S3
                        "s3Bucket": {"bsonType": "string"},           # Nombre del bucket S3
                        "s3Key": {"bsonType": "string"},              # Key/path en S3
                        "s3Region": {"bsonType": "string"},           # Región de AWS
                        "s3Url": {"bsonType": "string"},              # URL completa de S3
                        "s3VersionId": {"bsonType": "string"},        # Versionado de S3
                        
                        
                        
                        
                        "description": {"bsonType": "string"},
                        "hashtags": {"bsonType": "array"},
                        "category": {"bsonType": "string", "enum": ["social", "ads", "web", "other"]},
                        "platform": {"bsonType": "string", "enum": ["Youtube", "Instagram", "Facebook", "Tiktok", "other"]},
                        "vectorEmbedding": {"bsonType": "array"},
                        "userId": {"bsonType": "string"}, 
                        "clientId": {"bsonType": "string"},
                        "requestId": {"bsonType": "string"},
                        "requestDescription": {"bsonType": "string"},
                        "campaignId": {"bsonType": "string"},
                        "adId": {"bsonType": "string"},
                        "strategyId": {"bsonType": "string"},
                        "deliveryStatus": {"bsonType": "string", "enum": ["Pending", "Delivered", "Processing"]},
                        "createdAt": {"bsonType": "date"},
                        "updatedAt": {"bsonType": "date"},
                        "usageCount": {"bsonType": "int"},
                        "rights": {"bsonType": "string"}
                    }
                }
            })
            print("Colección 'PCmedia' creada")
        except CollectionInvalid:
            print("Colección 'PCimages' ya existe")
        
        # ÍNDICES
        db.PCmedia.create_index([("s3Bucket", ASCENDING), ("s3Key", ASCENDING)], unique=True)
        db.PCmedia.create_index([("clientId", ASCENDING), ("createdAt", DESCENDING)])
        db.PCmedia.create_index([("mediaId", ASCENDING)], unique=True)
        db.PCmedia.create_index([("hashtags", ASCENDING)])
        db.PCmedia.create_index([("description", TEXT)])
        db.PCmedia.create_index([("createdAt", DESCENDING)])
        db.PCmedia.create_index([("status", ASCENDING)])
        db.PCmedia.create_index([("clientId", ASCENDING)])
        db.PCmedia.create_index([("campaignId", ASCENDING)])
        print("  → Índices creados para 'PCmedia'")
        
        # ============================================
        # 8. COLECCIÓN: PCContent_Requests
        # ============================================
        try:
            db.create_collection("PCContent_Requests", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["requestId", "clientId"],
                    "properties": {
                        "requestId": {"bsonType": "string"},
                        "clientId": {"bsonType": "string"},
                        "contentType": {"bsonType": "string"},
                        "description": {"bsonType": "string"},
                        "targetAudience": {"bsonType": "string"},
                        "campaignDescription": {"bsonType": "string"},
                        "httpMethod": {"bsonType": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
                        "requestHeaders": {"bsonType": "object"},
                        "requestBody": {"bsonType": "object"},
                        "ipAddress": {"bsonType": "string"},
                        "generatedContent": {
                            "bsonType": "array",
                            "description": "Contenido generado como resultado",
                            "items": {
                                "bsonType": "object",
                                "properties": {
                                    "contentId": {"bsonType": "string"},
                                    "contentType": {"bsonType": "string"},
                                    "url": {"bsonType": "string"},
                                    "metadata": {"bsonType": "object"}
                                    }
                            }
                        },
                        "status": {"bsonType": "string", "enum": ["pending", "processing", "completed", "failed"]},
                        "createdAt": {"bsonType": "date"},
                        "completedAt": {"bsonType": "date"},
                        "processingTime": {"bsonType": "int"}
                    }
                }
            })
            print("✓ Colección 'PCContent_Requests' creada")
        except CollectionInvalid:
            print("Colección 'PCContent_Requests' ya existe")
        
        # ÍNDICES
        db.PCContent_Requests.create_index([("requestId", ASCENDING)], unique=True)
        db.PCContent_Requests.create_index([("clientId", ASCENDING)])
        db.PCContent_Requests.create_index([("userId", ASCENDING)])
        db.PCContent_Requests.create_index([("createdAt", DESCENDING)])
        db.PCContent_Requests.create_index([("status", ASCENDING)])
        db.PCContent_Requests.create_index([("contentType", ASCENDING)])
        db.PCContent_Requests.create_index([("ipAddress", ASCENDING)])
        print("  → Índices creados para 'PCContent_Requests'")
        
        # ============================================
        # 9. COLECCIÓN: PC_Clients
        # ============================================
        try:
            db.create_collection("PCClients", validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["clientId", "email", "status"],
                    "properties": {
                        "clientId": {"bsonType": "string"},
                        "email": {"bsonType": "string"},
                        "name": {"bsonType": "string"},
                        "company": {"bsonType": "string"},
                        "phone": {"bsonType": "string"},
                        "createdAt": {"bsonType": "date"},
                        "updatedAt": {"bsonType": "date"},
                        "status": {"bsonType": "string", "enum": ["active", "inactive", "suspended"]},
                        "subscriptions": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "object",
                                "properties": {
                                    "subscriptionId": {"bsonType": "string"},
                                    "planId": {"bsonType": "string"},
                                    "planName": {"bsonType": "string"},
                                    "status": {"bsonType": "string", "enum": ["active", "paused", "cancelled"]},
                                    "startDate": {"bsonType": "date"},
                                    "endDate": {"bsonType": "date"},
                                    "renewalDate": {"bsonType": "date"},
                                    "paymentStatus": {"bsonType": "string", "enum": ["paid", "pending", "failed"]},
                                    "usageTracking": {
                                        "bsonType": "object",
                                        "description": "Rastreo de uso por feature",
                                        "additionalProperties": {
                                            "bsonType": "object",
                                            "properties": {
                                                "used": {"bsonType": "int"},
                                                "limit": {"bsonType": "int"},
                                                "resetDate": {"bsonType": "date"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
            print("Colección 'PCClients' creada")
        except CollectionInvalid:
            print("Colección 'PC_Clients' ya existe")
        
        # ÍNDICES
        db.PCClients.create_index([("clientId", ASCENDING)], unique=True)
        db.PCClients.create_index([("email", ASCENDING)], unique=True)
        db.PCClients.create_index([("status", ASCENDING)], unique=True)
        print("  → Índices creados para 'PCClients'")
        

        
      
        
    
      
        # ============================================
        # RESUMEN FINAL
        # ============================================
        print("-" * 60)
        print(f" Base de datos '{DATABASE_NAME}' configurada exitosamente")
        print(f" Total de colecciones creadas: 15")
        
        # Listar todas las colecciones
        collections = db.list_collection_names()
        print(f"\nColecciones disponibles:")
        for i, col in enumerate(collections, 1):
            print(f"  {i}. {col}")
        
        client.close()
        print("\n Conexión cerrada")
        
    except Exception as e:
        print(f"\n Error: {e}")
        sys.exit(1)

#Ejecutamos el script
if 1 == 1:
    print("=" * 60)
    print("CREACIÓN DE BASE DE DATOS - PROMPTCONTENT")
    print("=" * 60)
    create_database_and_collections()

    print("\n¡Script completado exitosamente!")
