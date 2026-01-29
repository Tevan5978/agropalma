# AGROPALM - Sistema de Desprendibles de Nómina

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

El sistema utiliza **localStorage** del navegador para guardar los desprendibles.

### Para Limpiar la Base de Datos (Borrar todos los desprendibles):
Abre la consola del navegador (F12) y ejecuta:
```javascript
localStorage.removeItem('AGROPALM_DESPRENDIBLES');
location.reload();
```

---

## 🎨 Características

✅ Diseño elegante y profesional  
✅ Colores AGROPALM (Azul, Verde, Café, Dorado)  
✅ Base de datos persistente (localStorage)  
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
3. **Almacenamiento**: Los desprendibles se guardan en localStorage
4. **Descarga**: Los empleados descargan sus desprendibles en PDF

---

Creado por: AGROPALM  
Versión: 1.0  
Última actualización: 28/01/2026
