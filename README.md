# Métricas de los Requerimientos No Funcionales

## Performance

### 1. Tecnologías Usadas
- **Backend:** NestJS (Node.js) con API REST  
- **Base de Datos:** PostgreSQL  
- **Caché:** Redis  

### Transacción Crítica
**Operación Seleccionada:** "Consulta simple del portal" (Lectura de 1 registro desde PostgreSQL + API REST NestJS).

### Meta de Performance
- **Requerimiento de Carga:** 100,000 operaciones por minuto.  
- **Requerimiento de Latencia:** Tiempo de respuesta < 2.5 segundos para operaciones estándar.  
- **Equivalencia en TPS:** 100,000 TPM ≈ 1,667 transacciones por segundo.  

---

### Benchmark de Referencia
- **Tecnología:** NestJS (REST) + PostgreSQL  
- **Benchmark Seleccionado:** "Consulta simple (1 registro)"  

**Datos Clave del Benchmark:**
- Tiempo de respuesta: 3.37 ms  
- Throughput máximo: 10,896 req/s  
- Hardware de prueba: AMD Ryzen 7 7745HX, 32 GB RAM, Windows 11/WSL  

---

### Cálculos Preliminares (Usando Supuestos)

**Cálculo Base de Capacidad:**
- 10,896 req/s × 60 = **653,760 transacciones por minuto (TPM)** por servidor.  

**Conclusión:**  
Un solo servidor del benchmark podría manejar ~653,760 TPM, muy por encima del target de 100,000 TPM.

---

### Ajustar el Cálculo al Hardware
**Hardware supuesto, servidor promedio:**  
AMD Ryzen 9 7900 (12 núcleos / 24 hilos), 32 GB DDR5, SSD NVMe.  

**Supuesto de Mejora:**  
50% más de potencia → 1.5x de mejoría.  

**Cálculo Ajustado:**  
- Nueva capacidad por servidor: 653,760 TPM × 1.5 = **980,640 TPM**.  

**Conclusión:**  
Cada servidor propuesto puede manejar ~980,640 TPM para consultas simples.

---

### Dimensionar el Clúster para Alcanzar el Target
- **Target:** 100,000 TPM  
- **Capacidad por Servidor Ajustada:** 980,640 TPM  

**Cálculo Teórico:**
- Servidores necesarios = 100,000 / 980,640 ≈ **0.102 servidores**

**Decisión de Diseño:**
- Clúster de **2 servidores** en configuración activo-activo.  

**Justificación:**
- Alta disponibilidad: Redundancia en caso de fallos.  
- Capacidad de sobra: 1,961,280 TPM total vs 100,000 TPM requerido.  
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
