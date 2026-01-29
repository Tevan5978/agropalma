// Sistema de Base de Datos con localStorage
let desprendiblesData = {};
let archivoCargado = null;

// Datos de empleados base
const empleadosData = {
    '1234567890': {
        nombre: 'Juan Pérez',
        email: 'juan.perez@agropalm.com'
    },
    '9876543210': {
        nombre: 'María García',
        email: 'maria.garcia@agropalm.com'
    }
};

// Funciones de Base de Datos
class BaseDatosLocal {
    constructor() {
        this.storageKey = 'AGROPALM_DESPRENDIBLES';
        this.inicializar();
    }

    inicializar() {
        // Crear estructura de base de datos si no existe
        if (!localStorage.getItem(this.storageKey)) {
            const datosIniciales = {
                desprendibles: [
                    {
                        id: 1,
                        cedula: '1234567890',
                        nombre: 'Juan Pérez',
                        periodo: 'primera-2026-01',
                        periodoTexto: 'Primera Quincena Enero 2026',
                        fechaCarga: '28/01/2026',
                        archivo: 'desprendible_juan_q1_2026.pdf',
                        estado: 'Procesado'
                    },
                    {
                        id: 2,
                        cedula: '9876543210',
                        nombre: 'María García',
                        periodo: 'primera-2026-01',
                        periodoTexto: 'Primera Quincena Enero 2026',
                        fechaCarga: '28/01/2026',
                        archivo: 'desprendible_maria_q1_2026.pdf',
                        estado: 'Procesado'
                    }
                ]
            };
            localStorage.setItem(this.storageKey, JSON.stringify(datosIniciales));
        }
    }

    obtenerTodos() {
        const datos = localStorage.getItem(this.storageKey);
        return datos ? JSON.parse(datos) : { desprendibles: [] };
    }

    obtenerPorCedula(cedula) {
        const datos = this.obtenerTodos();
        return datos.desprendibles.filter(d => d.cedula === cedula);
    }

    agregar(desprendible) {
        const datos = this.obtenerTodos();
        desprendible.id = datos.desprendibles.length > 0 ? Math.max(...datos.desprendibles.map(d => d.id)) + 1 : 1;
        datos.desprendibles.unshift(desprendible); // Agregar al inicio
        localStorage.setItem(this.storageKey, JSON.stringify(datos));
        return desprendible;
    }

    limpiar() {
        localStorage.removeItem(this.storageKey);
        this.inicializar();
    }
}

// Instanciar la base de datos
const bd = new BaseDatosLocal();

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

function inicializarApp() {
    // Configurar navegación de tabs
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            cambiarTab(this.dataset.tab);
        });
    });

    // Configurar formulario de empleado
    const empleadoForm = document.getElementById('empleadoForm');
    empleadoForm.addEventListener('submit', handleEmpleadoSubmit);

    // Configurar formulario de empresa
    const empresaForm = document.getElementById('empresaForm');
    empresaForm.addEventListener('submit', handleEmpresaSubmit);

    // Configurar input de archivo
    const archivoExcel = document.getElementById('archivoExcel');
    archivoExcel.addEventListener('change', handleFileSelect);

    // Cargar períodos disponibles
    cargarPeriodos();

    // Simular datos iniciales
    simularDatosIniciales();
}

function cambiarTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function cargarPeriodos() {
    const periodoSelect = document.getElementById('periodo');
    const ahora = new Date();
    const periodos = [];

    // Generar últimos 12 períodos (6 meses de quincenas)
    for (let i = 0; i < 6; i++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const mes = fecha.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
        const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
        
        periodos.push({
            value: `primera-${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
            label: `Primera Quincena ${mesCapitalizado}`
        });
        
        periodos.push({
            value: `segunda-${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
            label: `Segunda Quincena ${mesCapitalizado}`
        });
    }

    // Llenar el select
    periodos.forEach(periodo => {
        const option = document.createElement('option');
        option.value = periodo.value;
        option.textContent = periodo.label;
        periodoSelect.appendChild(option);
    });
}

function generarPDF(desprendible, nombreEmpleado, cedula) {
    try {
        // Crear nuevo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Colores AGROPALM
        const colorAzul = [30, 58, 138];      // #1e3a8a
        const colorVerde = [34, 197, 94];     // #22c55e
        const colorDorado = [212, 175, 55];   // #d4af37

        // Márgenes
        const margen = 15;
        let posY = 15;

        // Encabezado con línea de color
        doc.setFillColor(...colorAzul);
        doc.rect(0, 0, 210, 30, 'F');

        // Logo/Nombre de la empresa
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('AGROPALM', margen, posY + 12);

        // Título
        doc.setTextColor(...colorAzul);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        posY = 40;
        doc.text('DESPRENDIBLE DE NÓMINA', margen, posY);

        // Línea divisoria
        doc.setDrawColor(...colorVerde);
        doc.setLineWidth(0.5);
        doc.line(margen, posY + 5, 210 - margen, posY + 5);

        // Información del empleado
        posY += 15;
        doc.setTextColor(...colorAzul);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL EMPLEADO', margen, posY);

        posY += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${nombreEmpleado}`, margen, posY);
        posY += 6;
        doc.text(`Cédula: ${cedula}`, margen, posY);
        posY += 6;
        doc.text(`Período: ${desprendible.periodoTexto}`, margen, posY);
        posY += 6;
        doc.text(`Fecha de Carga: ${desprendible.fechaCarga}`, margen, posY);

        // Línea divisoria
        posY += 8;
        doc.setDrawColor(...colorVerde);
        doc.line(margen, posY, 210 - margen, posY);

        // Detalles del pago
        posY += 10;
        doc.setTextColor(...colorAzul);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DEL PAGO', margen, posY);

        posY += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Datos de ejemplo (pueden ser expandidos con datos reales)
        const conceptos = [
            { concepto: 'Salario Base', valor: '2,500,000' },
            { concepto: 'Bonificación', valor: '500,000' },
            { concepto: 'Aporte de Salud', valor: '-150,000' },
            { concepto: 'Aporte Pensión', valor: '-250,000' }
        ];

        // Tabla de conceptos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Concepto', margen, posY);
        doc.text('Valor', 180, posY);

        posY += 6;
        doc.setDrawColor(200, 200, 200);
        doc.line(margen, posY, 210 - margen, posY);

        posY += 3;
        doc.setFont('helvetica', 'normal');
        let total = 0;
        conceptos.forEach(item => {
            doc.setFontSize(8);
            doc.text(item.concepto, margen + 2, posY);
            doc.text(item.valor, 180, posY);
            posY += 5;
        });

        // Línea total
        posY += 2;
        doc.setDrawColor(...colorVerde);
        doc.setLineWidth(0.8);
        doc.line(margen, posY, 210 - margen, posY);

        posY += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('TOTAL NETO A PAGAR', margen, posY);
        doc.text('2,600,000', 180, posY);

        // Pie de página
        posY += 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Este desprendible es un comprobante de pago. Guárdalo para tus registros.', margen, posY);
        posY += 5;
        doc.text('Para consultas contacta a: recursos.humanos@agropalm.com', margen, posY);

        // Descargar el PDF
        const nombreArchivo = `Desprendible_${nombreEmpleado.replace(/\s+/g, '_')}_${desprendible.periodo}.pdf`;
        doc.save(nombreArchivo);

        return true;
    } catch (error) {
        console.error('Error al generar PDF:', error);
        return false;
    }
}

function handleEmpleadoSubmit(e) {
    e.preventDefault();

    const cedula = document.getElementById('cedula').value.trim();
    const periodo = document.getElementById('periodo').value;
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    // Ocultar mensajes previos
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Validar que la cédula sea válida
    if (!cedula) {
        errorMsg.textContent = '✗ Por favor ingresa tu cédula.';
        errorMsg.style.display = 'block';
        return;
    }

    if (!periodo) {
        errorMsg.textContent = '✗ Por favor selecciona un período.';
        errorMsg.style.display = 'block';
        return;
    }

    // Buscar desprendibles en la base de datos
    const desprendiblesPorCedula = bd.obtenerPorCedula(cedula);
    const desprendibleEncontrado = desprendiblesPorCedula.find(d => d.periodo === periodo);

    if (desprendibleEncontrado) {
        const nombreEmpleado = empleadosData[cedula] ? empleadosData[cedula].nombre : desprendibleEncontrado.nombre;
        
        // Mostrar mensaje de éxito
        successMsg.innerHTML = `<strong>✓ ¡Éxito!</strong><br>Descargando desprendible de ${nombreEmpleado}<br><em>${desprendibleEncontrado.periodoTexto}</em>`;
        successMsg.style.display = 'block';

        // Generar y descargar el PDF
        setTimeout(() => {
            const pdfGenerado = generarPDF(desprendibleEncontrado, nombreEmpleado, cedula);
            if (pdfGenerado) {
                console.log(`PDF descargado: Desprendible_${nombreEmpleado}_${desprendibleEncontrado.periodo}.pdf`);
            }
        }, 500);
    } else if (desprendiblesPorCedula.length > 0) {
        // Mostrar los períodos disponibles
        const periodosDisponibles = desprendiblesPorCedula.map(d => d.periodoTexto).join(', ');
        errorMsg.innerHTML = `<strong>✗ Período no encontrado</strong><br>Períodos disponibles: ${periodosDisponibles}`;
        errorMsg.style.display = 'block';
    } else {
        errorMsg.innerHTML = `<strong>✗ No encontrado</strong><br>No hay desprendibles asociados a esta cédula.<br>Por favor contacta a recursos humanos.`;
        errorMsg.style.display = 'block';
    }

    // Limpiar formulario
    setTimeout(() => {
        document.getElementById('empleadoForm').reset();
        successMsg.style.display = 'none';
    }, 3000);
}

function handleEmpresaSubmit(e) {
    e.preventDefault();

    const cedulaEmpleado = document.getElementById('cedulaEmpleado').value.trim();
    const periodoPago = document.getElementById('periodoPago').value;
    const mesPago = document.getElementById('mesPago').value;
    const uploadSuccess = document.getElementById('uploadSuccess');
    const uploadError = document.getElementById('uploadError');

    uploadSuccess.style.display = 'none';
    uploadError.style.display = 'none';

    if (!archivoCargado) {
        uploadError.textContent = '✗ Por favor selecciona un archivo Excel.';
        uploadError.style.display = 'block';
        return;
    }

    if (!cedulaEmpleado) {
        uploadError.textContent = '✗ Por favor ingresa la cédula del empleado.';
        uploadError.style.display = 'block';
        return;
    }

    // Crear período en formato estándar
    const periodoKey = `${periodoPago}-${mesPago.replace('-', '-')}`;
    const fecha = new Date(mesPago + '-01');
    const mesTexto = fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const mesCapitalizado = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
    const periodoTexto = (periodoPago === 'primera' ? 'Primera Quincena' : 'Segunda Quincena') + ' - ' + mesCapitalizado;

    // Crear objeto desprendible
    const desprendible = {
        cedula: cedulaEmpleado,
        nombre: empleadosData[cedulaEmpleado] ? empleadosData[cedulaEmpleado].nombre : cedulaEmpleado,
        periodo: periodoKey,
        periodoTexto: periodoTexto,
        fechaCarga: new Date().toLocaleDateString('es-CO'),
        archivo: archivoCargado.name,
        estado: 'Procesado'
    };

    // Guardar en la base de datos
    bd.agregar(desprendible);

    // Mostrar mensaje de éxito
    const nombreEmpleado = desprendible.nombre;
    uploadSuccess.innerHTML = `<strong>✓ ¡Desprendible guardado!</strong><br>${nombreEmpleado} (${cedulaEmpleado})<br><em>${periodoTexto}</em>`;
    uploadSuccess.style.display = 'block';

    console.log('Desprendible guardado en la base de datos:', desprendible);

    // Actualizar tabla de archivos
    actualizarTablaArchivos(desprendible);

    // Limpiar formulario
    setTimeout(() => {
        document.getElementById('empresaForm').reset();
        document.getElementById('fileName').textContent = '';
        archivoCargado = null;
        uploadSuccess.style.display = 'none';
    }, 2000);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileNameDiv = document.getElementById('fileName');

    if (file) {
        // Validar extensión
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            archivoCargado = file;
            fileNameDiv.textContent = `✓ Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            fileNameDiv.style.color = '#4caf50';
        } else {
            fileNameDiv.textContent = '✗ Por favor selecciona un archivo .xlsx o .xls';
            fileNameDiv.style.color = '#f44336';
            archivoCargado = null;
        }
    }
}

function actualizarTablaArchivos(desprendible) {
    const tbody = document.getElementById('filesTable');

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${desprendible.nombre}</td>
        <td>${desprendible.cedula}</td>
        <td>${desprendible.periodoTexto}</td>
        <td>${desprendible.fechaCarga}</td>
        <td><span class="badge badge-success">✓ ${desprendible.estado}</span></td>
    `;

    // Reemplazar la fila de "no hay archivos" o agregar la nueva
    if (tbody.querySelector('tr td[colspan]')) {
        tbody.innerHTML = '';
    }

    tbody.insertBefore(fila, tbody.firstChild);
}

function simularDatosIniciales() {
    // Cargar desprendibles desde la base de datos
    const tbody = document.getElementById('filesTable');
    const datos = bd.obtenerTodos();
    
    if (datos.desprendibles && datos.desprendibles.length > 0) {
        tbody.innerHTML = '';
        datos.desprendibles.forEach(desprendible => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${desprendible.nombre}</td>
                <td>${desprendible.cedula}</td>
                <td>${desprendible.periodoTexto}</td>
                <td>${desprendible.fechaCarga}</td>
                <td><span class="badge badge-success">✓ ${desprendible.estado}</span></td>
            `;
            tbody.appendChild(fila);
        });
    }
}

// Función para convertir Excel a PDF (placeholder - necesitaría librerías como jsPDF)
function convertirExcelAPDF(archivoExcel) {
    // Aquí iría la lógica para:
    // 1. Leer el archivo Excel
    // 2. Extraer datos por cédula
    // 3. Generar PDF individual
    // Para esto necesitarías: xlsx.js para leer Excel y jsPDF para generar PDFs
    console.log('Convertir Excel a PDF:', archivoExcel);
}

// Agregar estilos para badges dinámicamente
const style = document.createElement('style');
style.textContent = `
    .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .badge-success {
        background: #e8f5e9;
        color: #2e7d32;
    }

    .badge-pending {
        background: #fff3e0;
        color: #e65100;
    }
`;
document.head.appendChild(style);

// Función para buscar documentos por cédula
function buscarDocumentos(e) {
    e.preventDefault();

    const cedula = document.getElementById('searchCedula').value.trim();
    const anio = document.getElementById('searchAnio').value;
    const searchResults = document.getElementById('searchResults');
    const archivosTableBody = document.getElementById('archivosTableBody');

    if (!cedula) {
        alert('Por favor ingresa una cédula');
        return;
    }

    // Buscar desprendibles en la base de datos
    const desprendibles = bd.obtenerPorCedula(cedula);
    
    // Filtrar por año si se proporcionó
    let resultados = desprendibles;
    if (anio) {
        resultados = desprendibles.filter(d => d.anio === anio.toString());
    }

    if (resultados.length === 0) {
        alert('No se encontraron documentos para la cédula ingresada');
        searchResults.style.display = 'none';
        return;
    }

    // Mostrar resultados
    archivosTableBody.innerHTML = '';
    resultados.forEach((desprendible, index) => {
        const nombreEmpleado = empleadosData[cedula] ? empleadosData[cedula].nombre : desprendible.nombre;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nombreEmpleado}</td>
            <td>${cedula}</td>
            <td>${desprendible.periodoTexto}</td>
            <td>${desprendible.fechaCarga}</td>
            <td><span class="badge badge-success">✓ Activo</span></td>
            <td>
                <button type="button" class="btn-eliminar" onclick="eliminarDocumento('${cedula}', '${desprendible.periodo}')">
                    Eliminar
                </button>
            </td>
        `;
        archivosTableBody.appendChild(row);
    });

    searchResults.style.display = 'block';
}

// Función para eliminar un documento
function eliminarDocumento(cedula, periodo) {
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
        try {
            // Obtener todos los datos
            const datos = bd.obtenerTodos();
            
            // Buscar el índice del documento a eliminar
            const indiceEliminar = datos.desprendibles.findIndex(d => d.cedula === cedula && d.periodo === periodo);
            
            if (indiceEliminar !== -1) {
                // Eliminar del array
                datos.desprendibles.splice(indiceEliminar, 1);
                
                // Guardar de nuevo en localStorage
                localStorage.setItem(bd.storageKey, JSON.stringify(datos));
                
                alert('✅ Documento eliminado correctamente');
                
                // Recargar la búsqueda
                buscarDocumentos({ preventDefault: () => {} });
            } else {
                alert('❌ No se encontró el documento');
            }
        } catch (error) {
            alert('❌ Error al eliminar: ' + error.message);
            console.error(error);
        }
    }
}

// Función para manejar el cambio de archivo
function handleFileChange() {
    const fileInput = document.getElementById('fileUpload');
    const fileNameDisplay = document.querySelector('.file-name-display');
    
    if (fileInput && fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
    } else {
        fileNameDisplay.textContent = 'Ninguno...ado';
    }
}

// Agregar evento al archivo cuando está listo
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileChange);
    }

    // Prevenir que el click se propague
    const wrapper = document.getElementById('fileUploadWrapper');
    if (wrapper) {
        wrapper.addEventListener('click', function(e) {
            if (e.target.id !== 'fileUpload') {
                e.preventDefault();
            }
        });
    }
});

// Actualizar handleEmpresaSubmit para los nuevos campos
const originalHandleEmpresaSubmit = handleEmpresaSubmit;
function handleEmpresaSubmitNew(e) {
    e.preventDefault();

    const cedulaEmpleado = document.getElementById('cedulaEmpleado').value.trim();
    const anioPago = document.getElementById('anioPago').value.trim();
    const mesPago = document.getElementById('mesPago').value;
    const quincena = document.getElementById('quincena').value;
    const fileInput = document.getElementById('fileUpload');

    // Validar campos
    if (!cedulaEmpleado) {
        alert('❌ Por favor ingresa la cédula del empleado');
        return;
    }

    if (!anioPago) {
        alert('❌ Por favor ingresa el año');
        return;
    }

    if (!mesPago) {
        alert('❌ Por favor selecciona el mes');
        return;
    }

    if (!quincena) {
        alert('❌ Por favor selecciona la quincena');
        return;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('❌ Por favor selecciona un archivo');
        return;
    }

    // Crear periodo en formato compatible
    const mesTexto = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(mesPago) - 1];
    const periodoTexto = `${quincena === 'primera' ? 'Primera' : 'Segunda'} Quincena ${mesTexto} ${anioPago}`;
    const periodo = `${quincena}_quincena_${mesPago}_${anioPago}`;

    // Crear objeto desprendible
    const desprendible = {
        nombre: empleadosData[cedulaEmpleado] ? empleadosData[cedulaEmpleado].nombre : 'Empleado',
        cedula: cedulaEmpleado,
        periodo: periodo,
        periodoTexto: periodoTexto,
        anio: anioPago,
        mes: mesPago,
        quincena: quincena,
        archivo: fileInput.files[0].name,
        fechaCarga: new Date().toLocaleDateString('es-CO'),
        estado: 'Activo'
    };

    try {
        // Guardar en base de datos
        bd.agregar(desprendible);

        // Mostrar mensaje de éxito
        alert('✅ Desprendible cargado correctamente');
        
        // Limpiar formulario
        document.getElementById('empresaForm').reset();
        document.querySelector('.file-name-display').textContent = 'Ninguno...ado';
    } catch (error) {
        alert('❌ Error al cargar el desprendible: ' + error.message);
        console.error(error);
    }
}

// Reemplazar la función si existe el formulario de administración
if (document.getElementById('empresaForm') && document.getElementById('anioPago')) {
    handleEmpresaSubmit = handleEmpresaSubmitNew;
}

// Función para búsqueda simple de empleado
function handleEmpleadoSearchSubmit(e) {
    e.preventDefault();

    const cedula = document.getElementById('cedula').value.trim();
    const searchResults = document.getElementById('searchResults');
    const resultadosList = document.getElementById('resultadosList');

    if (!cedula) {
        alert('Por favor ingresa tu cédula');
        return;
    }

    // Buscar desprendibles en la base de datos
    const desprendibles = bd.obtenerPorCedula(cedula);

    if (desprendibles.length === 0) {
        alert('No se encontraron desprendibles para esta cédula');
        searchResults.style.display = 'none';
        return;
    }

    // Mostrar resultados
    resultadosList.innerHTML = '';
    desprendibles.forEach((desprendible, index) => {
        const div = document.createElement('div');
        div.className = 'resultado-item';
        div.innerHTML = `
            <div class="resultado-info">
                <div class="resultado-periodo">${desprendible.periodoTexto}</div>
                <div class="resultado-fecha">Cargado: ${desprendible.fechaCarga}</div>
            </div>
            <button type="button" class="btn-descargar" onclick="descargarPDFEmpleado('${cedula}', '${desprendible.periodo}')">
                Descargar
            </button>
        `;
        resultadosList.appendChild(div);
    });

    searchResults.style.display = 'block';
}

// Función para descargar PDF desde la sección de empleados
function descargarPDFEmpleado(cedula, periodo) {
    const desprendiblesPorCedula = bd.obtenerPorCedula(cedula);
    const desprendible = desprendiblesPorCedula.find(d => d.periodo === periodo);

    if (desprendible) {
        const nombreEmpleado = empleadosData[cedula] ? empleadosData[cedula].nombre : desprendible.nombre;
        generarPDF(desprendible, nombreEmpleado, cedula);
    } else {
        alert('No se pudo encontrar el desprendible');
    }
}
