# Métricas de los Requerimientos No Funcionales

## Performance

### 1. Tecnologías Usadas
- **Backend:** NestJS (Node.js) con API REST  
- **Base de Datos:** PostgreSQL  
- **Caché:** Redis  

### Transacción Crítica
**Operación Seleccionada:** "Consulta de múltiples registros del portal" (Lectura de 20 registros desde PostgreSQL + API REST NestJS).

### Meta de Performance
- **Requerimiento de Carga:** 100,000 operaciones por minuto.  
- **Requerimiento de Latencia:** Tiempo de respuesta < 2.5 segundos para operaciones estándar.  
- **Equivalencia en TPS:** 100,000 TPM ≈ 1,667 transacciones por segundo.  

---

### Benchmark de Referencia
- **Tecnología:** NestJS (REST) + PostgreSQL  
- **Benchmark Seleccionado:** "Consulta simple (1 registro)"
- Para 20 registros: Supuesto de 4x mayor tiempo de respuesta

**Datos Clave del Benchmark:**
- Tiempo de respuesta: 3.37 ms
- Throughput máximo: 10,896 req/s  
- Hardware de prueba: AMD Ryzen 7 7745HX, 32 GB RAM, Windows 11/WSL

  **Datos estimados sobre el benchmark:**
 -  Tiempo de respuesta estimado (20 registros): 13.48 ms (3.37 ms × 4)
 -  Throughput máximo ajustado: 2,724 req/s (10,896 req/s ÷ 4)
  

---

### Cálculos Preliminares (Usando Supuestos de 20 registros)

**Cálculo Base de Capacidad:**
- 2,724 req/s × 60 = 163,440 transacciones por minuto (TPM) por servidor.  

**Conclusión:**  
Un solo servidor del benchmark ajustado podría manejar ~163,440 TPM, por encima del target de 100,000 TPM.

---

### Ajustar el Cálculo al Hardware
**Hardware supuesto, servidor promedio:**  
AMD Ryzen 9 7900 (12 núcleos / 24 hilos), 32 GB DDR5, SSD NVMe.  

**Supuesto de Mejora:**  
50% más de potencia → 1.5x de mejoría.  

**Cálculo Ajustado:**  
- Nueva capacidad por servidor: 163,440 TPM × 1.5 = 245,160 TPM. 

**Conclusión:**  
Cada servidor propuesto puede manejar ~245,160 TPM para consultas de 20 registros.


---

### Dimensionar el Clúster para Alcanzar el Target
- **Target:** 100,000 TPM  
- **Capacidad por Servidor Ajustada:** 245,160 TPM 

**Cálculo Teórico:**
- Servidores necesarios = 100,000 / 245,160 ≈ **0.408  servidores**

**Decisión de Diseño:**
- Clúster de **2 servidores** en configuración activo-activo.  

**Justificación:**
- Alta disponibilidad: Redundancia en caso de fallos.  
- Capacidad de sobra: 490,320 TPM total vs 100,000 TPM requerido.
- Mantenimiento sin downtime: Permite actualizaciones sin interrumpir servicio.  
- Preparación para crecimiento: Capacidad para manejar aumento de tráfico futuro.  

---

## Documentación

### 1. Benchmark Utilizado
- **Fuente:** "Performance Evaluation of REST and GraphQL"  
- **Operación:** "Consulta simple (1 registro)"  
- **Métricas:** 3.37 ms de latency, 10,896 req/s de throughput  
- **Hardware de referencia:** AMD Ryzen 7 7745HX, 32GB RAM  

 [Enlace al estudio](https://www.researchgate.net/publication/376998157_Nodejs_Performance_Benchmarking_and_Analysis_at_Virtualbox_Docker_and_Podman_Environment_Using_Node-Bench_Method)




# Cálculo para Escalabilidad

## Capacidad y Objetivos

- **Capacidad por pod:** 163,440 TPM  
- **Target requerido:** 100,000 TPM  
- **Target máximo (10x):** 1,000,000 TPM  

---

## Cálculos Actualizados

### Pods mínimos para carga base

- 100,000 / 163,440 = 0.612 → 2 pods

**Decisión:** Se eligieron **2 pods** para alta disponibilidad.  

### Pods necesarios para 10x escalabilidad

- 1,000,000 / 163,440 = 6.12 → 7 pods

### Pods máximos configurados
- 7 pods: (para crecimiento futuro).  

---

## Capacidad Comprobada

| Escenario | Pods | Capacidad Total (TPM) | Relación con Target |
|------------|------|------------------------|----------------------|
| Mínimo     | 2    | 326,880 TPM            | 3.27x el target requerido |
| 10x        | 7    | 1,144,080 TPM          | 1.14x el target de 1 millón |
| Máximo     | 20   | 3,268,800 TPM          | 32.69x el target requerido |

---

## Equivalencia AWS

- **Benchmark:** AMD Ryzen 7 7745HX (8 cores / 16 threads)  
- **AWS equivalente:** c6i.xlarge (4 vCPUs, 8 GB RAM) -> mitad del tamaño

### Justificación
- La consulta de 20 registros requiere más recursos, se considera una instancia más realista.  

## [Estructura de Archivos](https://github.com/RandyBaeza/PromptSales/tree/main/k8s-config)
- k8s-config/namespace.yaml - Namespace de producción
- k8s-config/secrets.yaml - Secretos de aplicación
- k8s-config/configmap.yaml - Configuración
- k8s-config/postgresql.yaml - Base de datos
- k8s-config/redis.yaml - Caché Redis
- k8s-config/nestjs-deployment.yaml - Backend principal
- k8s-config/hpa-autoscaling.yaml - Autoescalado
- k8s-config/services.yaml - Servicios y balanceo

---

## Reliability (Confiabilidad)

La confiabilidad mide la capacidad del sistema para funcionar sin fallos bajo la carga definida. El diseño se centra en la detección proactiva de errores y la integridad de las transacciones, cumpliendo con los requisitos de monitoreo del caso.

### 1. Métrica: Tasa de Error de Transacción

* **Objetivo Cuantitativo:** La tasa de errores del servidor (respuestas HTTP $5xx$) debe ser inferior al **0.1%** del total de transacciones diarias.
* **Parámetro Técnico:** Se monitorearán las métricas del *ingress controller* y los *logs* de los *pods* del *deployment* `nestjs-backend` para rastrear las respuestas $5xx$.
* **Justificación:** Un objetivo del 0.1% establece un estándar alto, permitiendo fallos esporádicos (ej. reinicios de *pods*, timeouts de red) sin impactar la percepción de confiabilidad del usuario.

### 2. Monitoreo y Alertas

Para cumplir con el requisito de "monitoreo y notificación de alertas", se implementará una pila de observabilidad basada en Prometheus, Grafana y Loki.

* **Logs Centralizados (Loki):**
    * **Tecnología:** Se desplegará **Loki** con **Promtail** (como `DaemonSet`) en el clúster.
    * **Implementación:** Promtail recolectará automáticamente los *logs* (stdout/stderr) de todos los contenedores dentro del *namespace* `nestjs-production`. Esto cumple el requisito de "logging centralizado".
    * **Retención:** Los *logs* se almacenarán con una política de retención de **90 días**.

* **Métricas de Base de Datos (Prometheus):**
    * **Tecnología:** **Prometheus** + **PostgreSQL Exporter**.
    * **Implementación:** Se activará la extensión `pg_stat_statements` en la instancia de PostgreSQL, como se solicita. El *exporter* consultará esta extensión y otras métricas de salud (ej. conexiones activas, bloqueos) y las expondrá para Prometheus.

* **Sistema de Alertas (Alertmanager):**
    * **Tecnología:** **Alertmanager** (integrado con Prometheus).
    * **Notificación:** Las alertas se enviarán a canales de **Slack** (prioridad media) y **PagerDuty** (prioridad alta/crítica), según se determine la severidad.
    * **Reglas de Alerta (Ejemplos):**
        * `HighErrorRate`: Tasa de errores $5xx$ > 0.1% sostenida durante 5 minutos.
        * `LowPodCount`: El número de *pods* del *deployment* `nestjs-backend` es menor que `minReplicas` (2).
        * `HPASaturated`: El HPA `nestjs-hpa` ha alcanzado su `maxReplicas` (20).
        * `LivenessProbeFailed`: K8s reporta fallos en la `livenessProbe` de un *pod* `nestjs-backend`.

---

## Availability (Disponibilidad)

La disponibilidad mide el tiempo que el sistema está operativo y accesible. El diseño de la infraestructura en Kubernetes se orienta a cumplir el objetivo de disponibilidad mediante la redundancia de los componentes de la aplicación y la resiliencia de los datos.

### 1. Métrica: Uptime

* **Objetivo Cuantitativo:** Disponibilidad mínima del **99.9%** mensual.
* **Parámetro Técnico:** Esto equivale a un tiempo máximo de inactividad permitido de **43.8 minutos por mes**.
* **Medición:** Se utilizará un servicio de monitoreo externo (ej. Grafana Blackbox Exporter o UptimeRobot) que verifique el *endpoint* público del `LoadBalancer` a intervalos regulares (ej. 1 minuto).

### 2. Diseño de Infraestructura

La disponibilidad se logra mediante la siguiente arquitectura en Kubernetes:

* **Capa 1: Balanceo de Carga y Aplicación (NestJS)**
    * **Balanceo de Carga:** El servicio `nestjs-service` es de tipo `LoadBalancer`. Utiliza anotaciones para provisionar un **Network Load Balancer (NLB) de AWS**, cumpliendo el requisito de "Considere load balancers".
    * **Redundancia de Aplicación:** El *deployment* `nestjs-backend` está configurado con `replicas: 2`. Esta decisión se basa en el cálculo de escalabilidad y garantiza alta disponibilidad para la aplicación: si un *pod* falla, el balanceador redirige el tráfico a la réplica saludable.
    * **Auto-reparación:** El `nestjs-deployment.yaml` define `livenessProbe` y `readinessProbe`. Si un *pod* falla la `livenessProbe`, K8s lo reinicia automáticamente, cumpliendo el requisito de "reinicio automático ante fallos".
    * **Escalabilidad Automática:** El HPA `nestjs-hpa` asegura la disponibilidad durante picos de carga, escalando automáticamente la aplicación desde `minReplicas: 2` hasta `maxReplicas: 20`.

* **Capa 2: Base de Datos (PostgreSQL)**
    * **Implementación:** La base de datos se despliega como un `StatefulSet` con `replicas: 1`, según se define en `postgresql.yaml`.
    * **Persistencia:** La disponibilidad de los datos está garantizada por el `volumeClaimTemplates`, que provisiona un volumen de almacenamiento persistente. Si el *pod* de PostgreSQL falla, el `StatefulSet` lo reiniciará y lo volverá a conectar al mismo volumen de datos.

* **Capa 3: Caché (Redis)**
    * **Implementación:** La caché se despliega como un `Deployment` con `replicas: 1`, según se define en `redis.yaml`.
    * **Recuperación:** Dado que Redis se usa para "datos cacheados" y "resultados temporales", un reinicio del *pod* (manejado por el `Deployment`) es aceptable. La aplicación NestJS recargará la caché desde PostgreSQL según sea necesario.

* **Capa 4: Tolerancia a Fallos (Backups)**
    * **Requerimiento:** El caso exige "backups automáticos diarios" con "retención mínima de 30 días".
    * **Implementación:** Se configurará un `CronJob` de Kubernetes en el *namespace* `nestjs-production`.
    * **Acción:** Este `CronJob` ejecutará una tarea diaria (ej. 3:00 AM) que utiliza `pg_dump` contra el servicio `postgres-service` y subirá el *backup* cifrado a un *bucket* de almacenamiento externo (ej. AWS S3). Dicho *bucket* tendrá una política de ciclo de vida que elimine los *backups* después de 30 días.


## Security

### 1. Autenticación y Autorización

#### Tecnologías:

- **Auth0:** con soporte nativo para OAuth 2.0 y OpenID Connect.
- **JWT (JSON Web Tokens):** firmados con RS256 para sesiones entre servicios.
- **Redis:** para almacenar tokens de acceso temporalmente.

#### Rendimiento

Benchmarks de Auth0 indican una latencia promedio de 120ms en Norteamérica y 600ms en regiones de Asia y el Pacífico. El uso de Redis para almacenar tokens JWT mejorará el rendimiento al reducir la carga de trabajo en la verificación de tokens.

Fuente: https://ssojet.com/blog/auth0-an-analysis-of-pros-and-cons/

### 2. Cifrado en Tránsito: TLS 1.3

#### Tecnología:

- TLS 1.3 con certificados Let’s Encrypt (RSA 2048 / ECDSA P-256).
- Configuración “A+” según SSL Labs Benchmark.
- Proxy de entrada: NGINX Ingress Controller en Kubernetes con soporte HTTP/2 + ALPN.

#### Configuración:

- Habilitado `ssl_prefer_server_ciphers on`; 
- Ciphersuites: `TLS_AES_128_GCM_SHA256` y `TLS_CHACHA20_POLY1305_SHA256`.

### 3. Cifrado en Reposo: AES-256

#### Tecnologías:

- PostgreSQL con pgcrypto (AES-256-CBC) para columnas sensibles.
- Archivos de backup cifrados con AES-256-GCM mediante gpg antes de subirlos a S3.
- Redis con tls-port habilitado y requirepass para cifrado y autenticación de sesiones cacheadas.

#### Parámetro Técnico:

- Rotación de claves cada 90 días (almacenadas en AWS KMS).
- Datos en buckets con Server-Side Encryption (SSE-S3).

## Interoperability
### 1. Integración de APIs REST y MCP Servers

Objetivo Cuantitativo:
Tiempo máximo de integración (round-trip API) ≤ 700 ms entre subempresas (PromptContent - PromptAds - PromptCRM).

#### Tecnologías:
- REST APIs (JSON) sobre HTTPS para servicios externos.
- MCP (Model Context Protocol) para comunicación segura entre servicios internos de IA.
- OpenAPI 3.1 para documentación y validación automática.

#### Parámetros Técnicos:

- Límite de tiempo de respuesta: 1 s máximo por integración.
- Retry automático con backoff exponencial (hasta 3 intentos).
- Circuit breaker activado (umbral: 5 fallos consecutivos).

#### Justificación Técnica:
Las pruebas con REST + MCP muestran un promedio de ~450 ms por intercambio con payloads de 2 KB–4 KB.
El límite de 700 ms asegura margen suficiente para mantener la fluidez en la orquestación de IA y analítica distribuida.

## Extensibility

### 1. Arquitectura Modular

- **Diseño:** El sistema está construido bajo una arquitectura modular basada en módulos independientes de NestJS, con separación lógica por dominio (ej. users, payments, prompts).

- **Ventaja:** Cada módulo puede añadirse, modificarse o eliminarse sin afectar el resto de la aplicación.

- **Interconexión:** Los módulos se comunican mediante interfaces y servicios desacoplados (Dependecy Injection).

### 2. Soporte para Nuevas Subempresas

- **Mecanismo:** Cada subempresa se cuenta con su propia base de datos, siguiendo la misma arquitectura mencionada anteriormente.

- **Configuración Dinámica:** Los parámetros de cada subempresa (nombre, branding, endpoints, políticas) se almacenan en una tabla de metadatos, lo que permite registrar nuevas sin cambios en el código.

### 3. Extensibilidad del API

**REST extensible:** Nuevos endpoints pueden añadirse fácilmente a través de nuevos controladores sin afectar las rutas existentes.

**Versionamiento:** El sistema soporta múltiples versiones del API (/api/v1, /api/v2), permitiendo coexistencia entre versiones antiguas y nuevas.

### 4. Escalabilidad de Componentes

**Infraestructura:** Kubernetes permite agregar nuevos módulos como Deployments independientes, cada uno con su propio ciclo de vida.

**Despliegue:** El namespace de producción soporta múltiples servicios nuevos sin necesidad de reiniciar o modificar los existentes.