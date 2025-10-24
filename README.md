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

100,000 / 163,440 = 0.612 → 2 pods

**Decisión:** Se eligieron **2 pods** para alta disponibilidad.  

### Pods necesarios para 10x escalabilidad


### Pods máximos configurados
**20 pods** (para crecimiento futuro).  

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
- **AWS equivalente:** c6i.xlarge (4 vCPUs, 8 GB RAM) → *mitad del tamaño*  

### Justificación
La consulta de **20 registros** requiere más recursos, por lo que se considera una instancia más realista.  

 
