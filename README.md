# AGROPALMA - Sistema de Desprendibles de Nómina

## 📋 Instrucciones de Uso

### Para Empleados (Descargar Desprendibles)
1. Haz clic en la pestaña **"Descarga tu Desprendible"**
2. Ingresa tu **cédula**
3. Selecciona el **período de pago** que deseas descargar
4. Haz clic en **"Descargar PDF"**

#### Cédulas de Prueba:
- **1234567890** - Juan Pérez
- **9876543210** - María García

#### Períodos Disponibles:
- Primera Quincena Enero 2026
- Segunda Quincena Enero 2026

---

### Para la Empresa (Subir Desprendibles)
1. Haz clic en la pestaña **"Subir Desprendibles"**
2. Ingresa la **cédula del empleado**
3. Selecciona el **período de pago** (Primera/Segunda Quincena)
4. Selecciona el **mes de pago**
5. Selecciona el **archivo Excel** (.xlsx o .xls)
6. Haz clic en **"Subir Archivo"**

El desprendible se guardará en la base de datos y los empleados podrán descargarlo.

---

## 💾 Base de Datos

El sistema utiliza **IndexedDB** en el navegador para funcionar sin conexión y una **base de datos en Netlify DB (Postgres/Neon)** para respaldar los registros en el servidor.

### Migraciones (Netlify DB)
1. Inicia sesión en Netlify CLI y vincula el sitio.
2. Obtén la URL de la base de datos con `netlify env:get NETLIFY_DATABASE_URL`.
3. Ejecuta la migración:
```bash
psql "$NETLIFY_DATABASE_URL" -f db/migrations/001_create_desprendibles.sql
```

### Limpieza local (IndexedDB)
Usa el panel de administración o borra los datos del sitio desde la configuración del navegador.

---

## 🎨 Características

✅ Diseño elegante y profesional  
✅ Colores AGROPALM (Azul, Verde, Café, Dorado)  
✅ Base de datos persistente (IndexedDB + Netlify DB)  
✅ Validaciones automáticas  
✅ Mensajes de error informativos  
✅ Interfaz responsiva (funciona en móvil)  
✅ Tabla de desprendibles cargados  

---

## 📱 Archivos del Proyecto

- **index.html** - Estructura HTML
- **styless.css** - Estilos CSS (diseño elegante)
- **script.js** - Lógica JavaScript (base de datos y funcionalidad)
- **README.md** - Este archivo

---

## 🔧 Cómo Funciona

1. **Carga Inicial**: El sistema carga datos de ejemplo al abrir la página
2. **Búsqueda**: Los empleados buscan por su cédula
3. **Almacenamiento**: Los desprendibles se guardan en IndexedDB y se respaldan en Netlify DB
4. **Descarga**: Los empleados descargan sus desprendibles en PDF

---

Creado por: AGROPALM  
Versión: 1.0  
Última actualización: 28/01/2026

