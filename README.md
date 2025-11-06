# 1. Métricas de los Requerimientos No Funcionales

## 1.1 Performance

Las tecnologías usadas son NestJS (Node.js) para el backend, PostgreSQL como base de datos y Redis para la caché. La transacción crítica seleccionada para el benchmark es la "Consulta de múltiples registros del portal" (20 registros). La meta de performance es de 100,000 operaciones por minuto (aproximadamente 1,667 TPS) con una latencia de respuesta inferior a 2.5 segundos.

### Benchmark de Referencia ([Enlace al benchmark](https://www.researchgate.net/publication/376998157_Nodejs_Performance_Benchmarking_and_Analysis_at_Virtualbox_Docker_and_Podman_Environment_Using_Node-Bench_Method))
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
  
### Especificación de Hardware y Configuración del Cluster

**Hardware en Cloud Provider**
- **Tipo de instancia AWS:** `c6i.2xlarge` (8 vCPUs, 16 GB RAM)  
- **Justificación:** Equivalente mejorado del hardware de benchmark, optimizado para cargas de base de datos  

**Cálculo de Capacidad por Servidor:**
- Capacidad base: 2,724 req/s × 60 = **163,440 TPM**  
- Con hardware mejorado (+50%): **245,160 TPM por servidor**

### Ajuste de Cálculo al Hardware

**Supuesto de Mejora:**  
50% más de potencia → 1.5x de mejoría.  

**Cálculo Ajustado:**  
- Nueva capacidad por servidor: 163,440 TPM × 1.5 = 245,160 TPM. 

**Conclusión:**  
Cada servidor propuesto puede manejar ~245,160 TPM para consultas de 20 registros.

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




## 1.2 Escalabilidad

### Capacidad y Objetivos:

- **Capacidad por pod:** 163,440 TPM  
- **Target requerido:** 100,000 TPM  
- **Target máximo (10x):** 1,000,000 TPM  

### Cálculos Actualizados:

#### Pods mínimos para carga base

- 100,000 / 163,440 = 0.612 → 2 pods

**Decisión:** Se eligieron **2 pods** para alta disponibilidad.  

#### Pods necesarios para 10x escalabilidad

- 1,000,000 / 163,440 = 6.12 → 7 pods

#### Pods máximos configurados
- 20 pods: (para crecimiento futuro).  


### Capacidad Comprobada

| Escenario | Pods | Capacidad Total (TPM) | Relación con Target |
|------------|------|------------------------|----------------------|
| Mínimo     | 2    | 326,880 TPM            | 3.27x el target requerido |
| 10x        | 7    | 1,144,080 TPM          | 1.14x el target de 1 millón |

 

### [Estructura de Archivos](https://github.com/RandyBaeza/PromptSales/tree/main/src/k8s-config)
- k8s-config/namespace.yaml - Namespace de producción
- k8s-config/secrets.yaml - Secretos de aplicación
- k8s-config/configmap.yaml - Configuración
- k8s-config/postgresql.yaml - Base de datos
- k8s-config/redis.yaml - Caché Redis
- k8s-config/nestjs-deployment.yaml - Backend principal
- k8s-config/hpa-autoscaling.yaml - Autoescalado
- k8s-config/services.yaml - Servicios y balanceo

## 1.3 Reliability (Confiabilidad)

La confiabilidad mide la capacidad del sistema para funcionar sin fallos bajo la carga definida. El diseño se centra en la detección proactiva de errores y la integridad de las transacciones, cumpliendo con los requisitos de monitoreo del caso.

### Métrica: Tasa de Error de Transacción

* **Objetivo Cuantitativo:** La tasa de errores del servidor (respuestas HTTP $5xx$) debe ser inferior al **0.1%** del total de transacciones diarias.
* **Parámetro Técnico:** Se monitorearán las métricas del *ingress controller* y los *logs* de los *pods* del *deployment* `nestjs-backend` para rastrear las respuestas $5xx$.
* **Justificación:** Un objetivo del 0.1% establece un estándar alto, permitiendo fallos esporádicos (ej. reinicios de *pods*, timeouts de red) sin impactar la percepción de confiabilidad del usuario.

### Monitoreo y Alertas

Para cumplir con el requisito de "monitoreo y notificación de alertas", se implementará una pila de observabilidad basada en Prometheus, Grafana y Loki.

* **Logs Centralizados (Stack de Observabilidad):**
    * **Tecnología:** Se desplegará el stack **Loki** (logs), **Prometheus** (métricas) y **Grafana** (visualización).
    * **Implementación:** Un `DaemonSet` de **Promtail** recolectará los logs. Prometheus recolectará métricas y **Grafana** se usará para construir los dashboards de monitoreo.
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

## 1.4 Availability (Disponibilidad)

La disponibilidad mide el tiempo que el sistema está operativo y accesible. El diseño de la infraestructura en Kubernetes se orienta a cumplir el objetivo de disponibilidad mediante la redundancia de los componentes de la aplicación y la resiliencia de los datos.

### Métrica: Uptime

* **Objetivo Cuantitativo:** Disponibilidad mínima del **99.9%** mensual.
* **Parámetro Técnico:** Esto equivale a un tiempo máximo de inactividad permitido de **43.8 minutos por mes**.
* **Medición:** Se utilizará un servicio de monitoreo externo (ej. Grafana Blackbox Exporter o UptimeRobot) que verifique el *endpoint* público del `LoadBalancer` a intervalos regulares (ej. 1 minuto).

### Diseño de Infraestructura

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


## 1.5 Security

### Autenticación y Autorización: Auth0

#### Tecnologías:

- **Auth0:** con soporte nativo para OAuth 2.0 y OpenID Connect.
- **JWT (JSON Web Tokens):** con RS256 para sesiones entre servicios.
- **Redis:** para almacenar tokens de acceso temporalmente.

Cumple con estándares de protección de datos (GDPR, CCPA) y políticas de acceso mediante permisos de usuario.

#### Rendimiento

Benchmarks de Auth0 indican una latencia promedio de 120ms en Norteamérica y 600ms en regiones de Asia y el Pacífico. El uso de Redis para almacenar tokens JWT mejorará el rendimiento al reducir la carga de trabajo en la verificación de tokens.

Fuente: https://ssojet.com/blog/auth0-an-analysis-of-pros-and-cons/

### Cifrado en Tránsito: TLS 1.3

#### Tecnología:

- TLS 1.3 con certificados **Let’s Encrypt** (**RSA 2048** / **ECDSA P-256**).
- Configuración con calificación “A+” según SSL Labs Benchmark.
- Proxy de entrada: **NGINX Ingress Controller** en Kubernetes con soporte HTTP/2 + ALPN.

#### Configuración:

- Habilitado `ssl_prefer_server_ciphers on;` para priorizar los cifrados más seguros. 
- Ciphersuites: `TLS_AES_128_GCM_SHA256` y `TLS_CHACHA20_POLY1305_SHA256`.

Un artículo menciona que con TLS 1.3 las conexiones “son dos veces más probables de completar el handshake bajo 100 ms comparado con TLS 1.2"

Fuente: https://www.ietf.org/blog/tls13-adoption/

### Cifrado en Reposo: AES-256

#### Tecnologías:

- PostgreSQL con **pgcrypto** (**AES-256-CBC**) para columnas sensibles.
- Archivos de backup cifrados con **AES-256-GCM** mediante gpg antes de subirlos a S3.
- Redis con tls-port habilitado y requirepass para cifrado y autenticación de sesiones cacheadas.


## 1.6 Maintainability

### Durante

- El codebase se manejará en GitHub, inicialmente con un solo repositorio.
- Se usará Jira como sistema para tiquetes por sus capacidades específicas para desarrollo de software.
- Los branches y pull requests se manejarán según Gitflow.
- Cada Branch se asociará a un tiquete de Jira relacionado al código, que debe ser referenciado en el nombre del branch y su PR.
- El nombre de versiones del main branch seguirá el formato: V<mayor>.<menor>.<parche>; donde “mayor” es el número de versiones que contengan cambios en arquitectura o funcionalidades nuevas que apliquen sobre todo el procedimiento de las campañas; “menor” es el número de commit por versión mayor que contenga el resto de cambios en arquitectura o lógica y nuevas funcionalidades; “parche” es el número de commit por versión menor que provenga de hotfix branches.
- Va a haber un release cada mes para mantenimiento y mejoras regulares. Los releases de hotfixes deben tardar un máximo de tres días para fallos críticos y un máximo de una semana en otros casos, contando a partir de que se apruebe el tiquete para el cambio.
- El pipelining de CI/CD se implementará con GitHub Actions.

### Después

&nbsp;&nbsp;&nbsp;&nbsp;L1->Guías escritas y Videos sobre uso del sistema accesibles desde la sección de ayuda del portal.

&nbsp;&nbsp;&nbsp;&nbsp;L2->Contacto por correo electrónico al equipo de soporte técnico para problemas no incluidos en la sección de ayuda. El tiempo máximo es de dos hábiles para responder y cuatro para solucionar.

&nbsp;&nbsp;&nbsp;&nbsp;L3->Para problemas recibidos por correo electrónico que requieran cambios en el sistema, se deben añadir como tickets en Jira. El tiempo máximo es de tres días hábiles para revisarlo y cinco para declarar como solucionado el ticket.


## 1.7 Interoperability
### Integración de APIs REST y MCP Servers

#### Tecnologías:
- REST APIs (JSON) sobre HTTPS para servicios externos.
- MCP (Model Context Protocol) para comunicación segura entre servicios internos de IA.
- OpenAPI 3.1 para documentación y validación automática.
- Versionado de API: `/api/v<versión>/` para compatibilidad futura.

#### Parámetros Técnicos:

- Límite de tiempo de respuesta: 1 s máximo por integración.
- Retry automático con backoff exponencial (hasta 3 intentos).
- Circuit breaker activado (umbral: 5 fallos consecutivos).


## 1.8 Compliance

- Uso de la extensión pgcrypto de PostgreSQL para datos sensibles de usuarios, pagos y empresas.
- Implementación de TLS para la comunicación con PostgreSQL.
- Protección de TLS keys por medio de Kubernetes Secrets.
- Uso de OWASP ZAP. Deben haber un máximo de 0 alertas de nivel de riesgo alto, 5 de riesgo medio, 7 de riesgo bajo y 20 informativas.
- Los pagos dentro del sistema se realizarán por medio de la integración de Stripe y PayPal.


## 1.9 Extensibility

### Domain-Driven Design

- La arquitectura DDD permite incorporar nuevos dominios como unidades independientes.

- Facilita la evolución de la plataforma sin impactar los sistemas existentes. 
 
- Los módulos se comunican mediante interfaces y servicios desacoplados (Dependecy Injection).

### Soporte para Nuevas Subempresas

- Cada subempresa se cuenta con su propia base de datos, siguiendo la misma arquitectura.

- Los parámetros de cada subempresa (nombre, branding, endpoints, políticas) se almacenan en una tabla de metadatos, lo que permite registrar nuevas sin cambios en el código.

### Extensibilidad del API

- Nuevos endpoints pueden añadirse fácilmente a través de nuevos controladores sin afectar las rutas existentes.

- El sistema soporta múltiples versiones del API (`/api/v1`, `/api/v2`), permitiendo coexistencia entre versiones antiguas y nuevas.

### Escalabilidad de Componentes

- Kubernetes permite agregar nuevos módulos como Deployments independientes, cada uno con su propio ciclo de vida.

- El namespace de producción soporta múltiples servicios nuevos sin necesidad de reiniciar o modificar los existentes.

### MCP Servers

- Nuevos módulos o modelos de IA pueden integrarse al MCP sin alterar otros sistemas.

---

# 2. Domain Driven Design

El diseño del sistema se basa en Domain-Driven Design (DDD), separando la lógica de negocio en Dominios (Bounded Contexts) claros e independientes.

## Diagrama de Dominios

El diagrama de arquitectura de dominios, sus capas (`Contract Layer`, `Modulos`, `Services`) y las pruebas (`Test`) se encuentra en el siguiente documento:

* **Diagrama de Dominios y Contratos:** 

[DDD&Contract\_Diagram.pdf](DDD&Contract_Diagram.pdf)

## 2.2 Identificación de Dominios Principales

El ecosistema se divide en cuatro dominios principales según el diagrama:

* **Common:** Contiene lógica y contratos compartidos por todos los dominios, como la gestión de Servicios (facturación), APIs y Usuarios (autenticación).
    * **Código Fuente:** [src/common/](<./src/common/>)
* **PromptContent:** Responsable de toda la generación, adaptación y gestión de contenido creativo (texto, imágenes, video).
    * **Código Fuente:** [src/prompt-content/](<./src/prompt-content>)
* **PromptAds:** Gestiona la ejecución de campañas publicitarias, segmentación de audiencias, auto-configuración y análisis de rendimiento.
    * **Código Fuente:** [src/prompt-ads/](<./src/prompt-ads>)
* **PromptCrm:** Enfocado en la gestión de leads, bots de comunicación y seguimiento del cliente potencial.
    * **Código Fuente:** [src/prompt-crm/](<./src/prompt-crm>)

## Contratos entre Dominios (Interfaces y APIs)

La comunicación entre dominios se define estrictamente a través de la **Contract Layer**. Estas interfaces aseguran la independencia de los dominios y están vinculadas al código fuente.

### Contratos de `Common`
* **Contrato de Servicios (Facturación):** [src/common/contracts/billing.contract.ts](<./src/common/contracts/billing.contract.ts>)
* **Contrato de Usuarios:** [src/common/contracts/user.contract.ts](<./src/common/contracts/user.contract.ts>)

### Contratos de `PromptContent`
* **Contrato Textual:** [src/prompt-content/contracts/text-content.contract.ts](<./src/prompt-content/contracts/text-content.contract.ts>)
* **Contrato de Imágenes:** [src/prompt-content/contracts/image-content.contract.ts](<./src/prompt-content/contracts/image-content.contract.ts>)
* **Contrato de Audio/Video:** [src/prompt-content/contracts/media-content.contract.ts](<./src/prompt-content/contracts/media-content.contract.ts>)
* **Contrato de Plataformas:** [src/prompt-content/contracts/platform.contract.ts](<./src/prompt-content/contracts/platform.contract.ts>)

### Contratos de `PromptAds`
* **Contrato de Campaña:** [src/prompt-ads/contracts/campaign.contract.ts](<./src/prompt-ads/contracts/campaign.contract.ts>)
* **Contrato de Auto-Configuración:** [src/prompt-ads/contracts/auto-config.contract.ts](<./src/prompt-ads/contracts/auto-config.contract.ts>)
* **Contrato de Audiencias:** [src/prompt-ads/contracts/audience.contract.ts](<./src/prompt-ads/contracts/audience.contract.ts>)

### Contratos de `PromptCrm`
* **Contrato de Bot de Comunicación:** [src/prompt-crm/contracts/bot.contract.ts](<./src/prompt-crm/contracts/bot.contract.ts>)
* **Contrato de Leads:** [src/prompt-crm/contracts/lead.contract.ts](<./src/prompt-crm/contracts/lead.contract.ts>)
* **Contrato de Plataformas (CRM):** [src/prompt-crm/contracts/platform.contract.ts](<./src/prompt-crm/contracts/platform.contract.ts>)

## Facades para Simplificar Interacción

Para cumplir con el requisito de "crear facades", el **Portal Web Unificado (`PromptSales`)** actuará como el orquestador. Implementará facades que consumen los contratos de los otros dominios para simplificar operaciones complejas.

* **Facade: `CampaignOrchestratorFacade`**
    * **Responsabilidad:** Simplifica el "Diseño de estrategias de mercadeo". Una sola llamada a esta facade inicia la generación de contenido en `PromptContent`, la creación de la campaña en `PromptAds` y la configuración de seguimiento en `PromptCrm`.
    * **Ver Código:** [src/prompt-sales/application/facades/campaign-orchestrator.facade.ts](<./src/prompt-sales/application/facades/campaign-orchestrator.facade.ts>)

## Pruebas por Dominio

El diseño incluye pruebas unitarias y de integración por dominio, como se refleja en la columna `Test` del diagrama.

* **Pruebas de Contrato (Integración):** Verifican que la implementación de un servicio (ej. `PromptContent`) cumple con la interfaz (`IContentContract`) que espera el consumidor (ej. `PromptAds`).
    * **Ejemplo:** [src/prompt-content/test/text-content.contract.test.ts](<./src/prompt-content/test/text-content.contract.test.ts>)
* **Pruebas Unitarias (Unit Tests):** Prueban la lógica de negocio interna de los módulos y servicios de cada dominio.
    * **Ejemplo:** [src/prompt-ads/test/audience-segmentation.unit.test.ts](<./src/prompt-ads/test/audience-segmentation.unit.test.ts>)
