// Sistema de Base de Datos con IndexedDB
let subiendoArchivo = false;
let desprendiblesData = {};
let archivoCargado = null;
async function handleEmpresaSubmit(e) {
    e.preventDefault();

    if (subiendoArchivo) {
        console.warn('⛔ Envío duplicado bloqueado');
        return;
    }
    subiendoArchivo = true;
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

// ============================================================
// CLASE DE BASE DE DATOS CON IndexedDB
// ============================================================
class BaseDatosIndexedDB {
    constructor() {
        this.dbName = 'AGROPALMA_DB';
        this.dbVersion = 2;
        this.db = null;
    }

    async inicializar() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Base de datos IndexedDB inicializada');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                
                console.log(`🔄 Actualizando base de datos de versión ${oldVersion} a ${this.dbVersion}`);
                
                if (!db.objectStoreNames.contains('desprendibles')) {
                    const objectStore = db.createObjectStore('desprendibles', { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('cedula', 'cedula', { unique: false });
                    objectStore.createIndex('periodo', 'periodo', { unique: false });
                    objectStore.createIndex('cedula_periodo', ['cedula', 'periodo'], { unique: false });
                    console.log('✅ Object store "desprendibles" creado');
                } else {
                    const transaction = event.target.transaction;
                    const objectStore = transaction.objectStore('desprendibles');
                    
                    if (!objectStore.indexNames.contains('cedula')) {
                        objectStore.createIndex('cedula', 'cedula', { unique: false });
                    }
                    if (!objectStore.indexNames.contains('periodo')) {
                        objectStore.createIndex('periodo', 'periodo', { unique: false });
                    }
                    if (!objectStore.indexNames.contains('cedula_periodo')) {
                        objectStore.createIndex('cedula_periodo', ['cedula', 'periodo'], { unique: false });
                    }
                }
            };
        });
    }

    async obtenerTodos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['desprendibles'], 'readonly');
            const objectStore = transaction.objectStore('desprendibles');
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerPorCedula(cedula) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['desprendibles'], 'readonly');
            const objectStore = transaction.objectStore('desprendibles');
            const index = objectStore.index('cedula');
            const request = index.getAll(cedula);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async existe(cedula, periodo) {
        try {
            const transaction = this.db.transaction(['desprendibles'], 'readonly');
            const objectStore = transaction.objectStore('desprendibles');
            
            if (objectStore.indexNames.contains('cedula_periodo')) {
                const index = objectStore.index('cedula_periodo');
                const request = index.get([cedula, periodo]);
                
                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result !== undefined);
                    request.onerror = () => reject(request.error);
                });
            } else {
                const todos = await this.obtenerTodos();
                return todos.some(d => d.cedula === cedula && d.periodo === periodo);
            }
        } catch (error) {
            console.warn('Error al verificar existencia, usando fallback:', error);
            const todos = await this.obtenerTodos();
            return todos.some(d => d.cedula === cedula && d.periodo === periodo);
        }
    }

    async agregar(desprendible) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['desprendibles'], 'readwrite');
            const objectStore = transaction.objectStore('desprendibles');
            const request = objectStore.add(desprendible);

            request.onsuccess = () => {
                desprendible.id = request.result;
                resolve(desprendible);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async eliminar(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['desprendibles'], 'readwrite');
            const objectStore = transaction.objectStore('desprendibles');
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async eliminarPorCedulaPeriodo(cedula, periodo) {
        const todos = await this.obtenerTodos();
        const encontrado = todos.find(d => d.cedula === cedula && d.periodo === periodo);
        
        if (encontrado) {
            return await this.eliminar(encontrado.id);
        }
        return false;
    }

    async limpiar() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['desprendibles'], 'readwrite');
            const objectStore = transaction.objectStore('desprendibles');
            const request = objectStore.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Instanciar la base de datos
const bd = new BaseDatosIndexedDB();

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await bd.inicializar();
        console.log('✅ Base de datos lista');
        inicializarApp();
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        alert('Error al inicializar la aplicación. Por favor recarga la página.');
    }
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
    if (empleadoForm) {
        empleadoForm.addEventListener('submit', handleEmpleadoSubmit);
    }

    // Configurar formulario de empresa
    const empresaForm = document.getElementById('empresaForm');
    if (empresaForm) {
        empresaForm.addEventListener('submit', handleEmpresaSubmit);
    }

    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileChange);
    }

    // Cargar períodos disponibles
    cargarPeriodos();

    // Cargar datos iniciales
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
    if (!periodoSelect) return;

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

// ============================================================
// FUNCIÓN: Convertir archivo a ArrayBuffer
// ============================================================
function archivoAArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// ============================================================
// FUNCIÓN: Descargar Excel original
// ============================================================
function descargarExcelOriginal(desprendible) {
    try {
        if (!desprendible.archivoBlob) {
            alert('⚠️ Este desprendible no tiene archivo disponible.\nPor favor contacta a Recursos Humanos.');
            return false;
        }

        // Crear blob desde el ArrayBuffer guardado
        const blob = new Blob([desprendible.archivoBlob], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = desprendible.archivo || `Desprendible_${desprendible.cedula}_${desprendible.periodo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`✅ Excel descargado: ${desprendible.archivo}`);
        return true;
        
    } catch (error) {
        console.error('Error al descargar Excel:', error);
        alert('❌ Error al descargar el archivo: ' + error.message);
        return false;
    }
}

// ============================================================
// HANDLE EMPLEADO SUBMIT - DESCARGA EN EXCEL
// ============================================================
async function handleEmpleadoSubmit(e) {
    e.preventDefault();

    const cedula = document.getElementById('cedula').value.trim();
    const periodo = document.getElementById('periodo').value;
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    if (!cedula) {
        if (errorMsg) {
            errorMsg.textContent = '✗ Por favor ingresa tu cédula.';
            errorMsg.style.display = 'block';
        }
        return;
    }

    if (!periodo) {
        if (errorMsg) {
            errorMsg.textContent = '✗ Por favor selecciona un período.';
            errorMsg.style.display = 'block';
        }
        return;
    }

    try {
        const desprendiblesPorCedula = await bd.obtenerPorCedula(cedula);
        const desprendibleEncontrado = desprendiblesPorCedula.find(d => d.periodo === periodo);

        if (desprendibleEncontrado) {
            const nombreEmpleado = empleadosData[cedula] ? empleadosData[cedula].nombre : desprendibleEncontrado.nombre;
            
            if (successMsg) {
                successMsg.innerHTML = `<strong>✓ ¡Éxito!</strong><br>Descargando desprendible de ${nombreEmpleado}<br><em>${desprendibleEncontrado.periodoTexto}</em>`;
                successMsg.style.display = 'block';
            }

            // Descargar Excel original
            setTimeout(() => {
                descargarExcelOriginal(desprendibleEncontrado);
            }, 500);
        } else if (desprendiblesPorCedula.length > 0) {
            const periodosDisponibles = desprendiblesPorCedula.map(d => d.periodoTexto).join(', ');
            if (errorMsg) {
                errorMsg.innerHTML = `<strong>✗ Período no encontrado</strong><br>Períodos disponibles: ${periodosDisponibles}`;
                errorMsg.style.display = 'block';
            }
        } else {
            if (errorMsg) {
                errorMsg.innerHTML = `<strong>✗ No encontrado</strong><br>No hay desprendibles asociados a esta cédula.`;
                errorMsg.style.display = 'block';
            }
        }

        setTimeout(() => {
            document.getElementById('empleadoForm').reset();
            if (successMsg) successMsg.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        if (errorMsg) {
            errorMsg.textContent = '✗ Error al buscar desprendibles';
            errorMsg.style.display = 'block';
        }
    }
}

// ============================================================
// HANDLE EMPRESA SUBMIT - CON PREVENCIÓN DE DUPLICADOS
// ============================================================
async function handleEmpresaSubmit(e) {
    e.preventDefault();

    const cedulaEmpleado = document.getElementById('cedulaEmpleado').value.trim();
    const anioPago = document.getElementById('anioPago')?.value.trim();
    const mesPago = document.getElementById('mesPago')?.value;
    const quincena = document.getElementById('quincena')?.value;
    const periodoPago = document.getElementById('periodoPago')?.value;
    const fileInput = document.getElementById('fileUpload');
    
    const uploadSuccess = document.getElementById('uploadSuccess');
    const uploadError = document.getElementById('uploadError');

    if (uploadSuccess) uploadSuccess.style.display = 'none';
    if (uploadError) uploadError.style.display = 'none';

    // Validaciones
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        const mensaje = '✗ Por favor selecciona un archivo Excel.';
        if (uploadError) {
            uploadError.textContent = mensaje;
            uploadError.style.display = 'block';
        } else {
            alert('❌ ' + mensaje);
        }
        return;
    }

    if (!cedulaEmpleado) {
        const mensaje = '✗ Por favor ingresa la cédula del empleado.';
        if (uploadError) {
            uploadError.textContent = mensaje;
            uploadError.style.display = 'block';
        } else {
            alert('❌ ' + mensaje);
        }
        return;
    }

    try {
        // Crear período
        let periodoKey, periodoTexto;
        
        if (anioPago && mesPago && quincena) {
            const mesTexto = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(mesPago) - 1];
            periodoTexto = `${quincena === 'primera' ? 'Primera' : 'Segunda'} Quincena ${mesTexto} ${anioPago}`;
            periodoKey = `${quincena}_quincena_${mesPago}_${anioPago}`;
        } else if (periodoPago && mesPago) {
            const fecha = new Date(mesPago + '-01');
            const mesTexto = fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            const mesCapitalizado = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
            periodoTexto = (periodoPago === 'primera' ? 'Primera Quincena' : 'Segunda Quincena') + ' - ' + mesCapitalizado;
            periodoKey = `${periodoPago}-${mesPago.replace('-', '-')}`;
        } else {
            throw new Error('Faltan datos del período');
        }

        // ============================================================
        // PREVENIR DUPLICADOS - VERIFICACIÓN DOBLE
        // ============================================================
        const yaExiste = await bd.existe(cedulaEmpleado, periodoKey);
        
        if (yaExiste) {
            if (uploadError) {
                uploadError.innerHTML = `<strong>⚠️ Duplicado detectado</strong><br>Ya existe un desprendible para:<br><strong>${empleadosData[cedulaEmpleado]?.nombre || cedulaEmpleado}</strong><br><em>${periodoTexto}</em>`;
                uploadError.style.display = 'block';
            } else {
                alert(`⚠️ YA EXISTE UN DESPRENDIBLE\n\nEmpleado: ${empleadosData[cedulaEmpleado]?.nombre || cedulaEmpleado}\nCédula: ${cedulaEmpleado}\nPeríodo: ${periodoTexto}\n\nNo se pueden guardar duplicados.`);
            }
            
            // Limpiar el formulario
            document.getElementById('empresaForm').reset();
            const fileNameDisplay = document.querySelector('.file-name-display') || document.getElementById('fileName');
            if (fileNameDisplay) fileNameDisplay.textContent = '';
            archivoCargado = null;
            
            return; // NO GUARDAR
        }

        if (uploadSuccess) {
            uploadSuccess.innerHTML = `<strong>⏳ Guardando archivo...</strong>`;
            uploadSuccess.style.display = 'block';
        }

        // Convertir archivo a ArrayBuffer
        const archivoArrayBuffer = await archivoAArrayBuffer(fileInput.files[0]);

        // Crear objeto desprendible
        const desprendible = {
            cedula: cedulaEmpleado,
            nombre: empleadosData[cedulaEmpleado] ? empleadosData[cedulaEmpleado].nombre : 'Empleado',
            periodo: periodoKey,
            periodoTexto: periodoTexto,
            fechaCarga: new Date().toLocaleDateString('es-CO'),
            archivo: fileInput.files[0].name,
            archivoBlob: archivoArrayBuffer,
            archivoSize: fileInput.files[0].size,
            estado: 'Procesado'
        };

        console.log('📝 Guardando desprendible:', {
            cedula: desprendible.cedula,
            periodo: desprendible.periodo,
            archivo: desprendible.archivo
        });

        // Guardar en IndexedDB
        await bd.agregar(desprendible);

        const tamaño = (desprendible.archivoSize / 1024).toFixed(2);
        if (uploadSuccess) {
            uploadSuccess.innerHTML = `<strong>✓ ¡Desprendible guardado!</strong><br>${desprendible.nombre} (${cedulaEmpleado})<br><em>${periodoTexto}</em><br><small>Tamaño: ${tamaño} KB</small>`;
            uploadSuccess.style.display = 'block';
        } else {
            alert(`✅ Desprendible guardado\n${desprendible.nombre}\n${periodoTexto}\nTamaño: ${tamaño} KB`);
        }

        console.log('✅ Desprendible guardado exitosamente');

        // Actualizar tabla
        actualizarTablaArchivos(desprendible);

        // Limpiar formulario
        setTimeout(() => {
            document.getElementById('empresaForm').reset();
            const fileNameDisplay = document.querySelector('.file-name-display') || document.getElementById('fileName');
            if (fileNameDisplay) fileNameDisplay.textContent = '';
            archivoCargado = null;
            if (uploadSuccess) uploadSuccess.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('❌ Error al guardar:', error);
        const mensaje = `✗ Error: ${error.message}`;
        if (uploadError) {
            uploadError.textContent = mensaje;
            uploadError.style.display = 'block';
        } else {
            alert('❌ ' + mensaje);
        }
        
        // Limpiar formulario en caso de error
        document.getElementById('empresaForm').reset();
        const fileNameDisplay = document.querySelector('.file-name-display') || document.getElementById('fileName');
        if (fileNameDisplay) fileNameDisplay.textContent = '';
        archivoCargado = null;
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileNameDiv = document.getElementById('fileName');

    if (file) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            archivoCargado = file;
            if (fileNameDiv) {
                fileNameDiv.textContent = `✓ Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                fileNameDiv.style.color = '#4caf50';
            }
        } else {
            if (fileNameDiv) {
                fileNameDiv.textContent = '✗ Por favor selecciona un archivo .xlsx o .xls';
                fileNameDiv.style.color = '#f44336';
            }
            archivoCargado = null;
        }
    }
}

function handleFileChange() {
    const fileInput = document.getElementById('fileUpload');
    const fileNameDisplay = document.querySelector('.file-name-display');
    
    if (fileInput && fileInput.files.length > 0) {
        if (fileNameDisplay) {
            fileNameDisplay.textContent = fileInput.files[0].name;
        }
    } else {
        if (fileNameDisplay) {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
        }
    }
}

function actualizarTablaArchivos(desprendible) {
    const tbody = document.getElementById('filesTable');
    if (!tbody) return;

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${desprendible.nombre}</td>
        <td>${desprendible.cedula}</td>
        <td>${desprendible.periodoTexto}</td>
        <td>${desprendible.fechaCarga}</td>
        <td><span class="badge badge-success">✓ ${desprendible.estado}</span></td>
    `;

    if (tbody.querySelector('tr td[colspan]')) {
        tbody.innerHTML = '';
    }

    tbody.insertBefore(fila, tbody.firstChild);
}

async function simularDatosIniciales() {
    const tbody = document.getElementById('filesTable');
    if (!tbody) return;

    try {
        const desprendibles = await bd.obtenerTodos();
        
        if (desprendibles && desprendibles.length > 0) {
            tbody.innerHTML = '';
            desprendibles.forEach(desprendible => {
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
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Estilos
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

// ============================================================
// FUNCIONES ADICIONALES
// ============================================================

async function buscarDocumentos(e) {
    e.preventDefault();

    const cedula = document.getElementById('searchCedula').value.trim();
    const searchResults = document.getElementById('searchResults');
    const archivosTableBody = document.getElementById('archivosTableBody');

    if (!cedula) {
        alert('Por favor ingresa una cédula');
        return;
    }

    try {
        const desprendibles = await bd.obtenerPorCedula(cedula);

        if (desprendibles.length === 0) {
            alert('No se encontraron documentos para la cédula ingresada');
            if (searchResults) searchResults.style.display = 'none';
            return;
        }

        if (archivosTableBody) {
            archivosTableBody.innerHTML = '';
            desprendibles.forEach((desprendible) => {
                const nombreEmpleado = empleadosData[cedula] ? empleadosData[cedula].nombre : desprendible.nombre;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombreEmpleado}</td>
                    <td>${cedula}</td>
                    <td>${desprendible.periodoTexto}</td>
                    <td>${desprendible.fechaCarga}</td>
                    <td><span class="badge badge-success">✓ Activo</span></td>
                    <td>
                        <button type="button" class="btn-eliminar" onclick="eliminarDocumento(${desprendible.id})">
                            Eliminar
                        </button>
                    </td>
                `;
                archivosTableBody.appendChild(row);
            });
        }

        if (searchResults) searchResults.style.display = 'block';
    } catch (error) {
        alert('Error al buscar documentos: ' + error.message);
    }
}

async function eliminarDocumento(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
        try {
            await bd.eliminar(id);
            alert('✅ Documento eliminado correctamente');
            buscarDocumentos({ preventDefault: () => {} });
        } catch (error) {
            alert('❌ Error al eliminar: ' + error.message);
        }
    }
}

async function handleEmpleadoSearchSubmit(e) {
    e.preventDefault();

    const cedula = document.getElementById('cedula').value.trim();
    const searchResults = document.getElementById('searchResults');
    const resultadosList = document.getElementById('resultadosList');

    if (!cedula) {
        alert('Por favor ingresa tu cédula');
        return;
    }

    try {
        const desprendibles = await bd.obtenerPorCedula(cedula);

        if (desprendibles.length === 0) {
            alert('No se encontraron desprendibles para esta cédula');
            if (searchResults) searchResults.style.display = 'none';
            return;
        }

        if (resultadosList) {
            resultadosList.innerHTML = '';
            desprendibles.forEach((desprendible) => {
                const div = document.createElement('div');
                div.className = 'resultado-item';
                div.innerHTML = `
                    <div class="resultado-info">
                        <div class="resultado-periodo">${desprendible.periodoTexto}</div>
                        <div class="resultado-fecha">Cargado: ${desprendible.fechaCarga}</div>
                    </div>
                    <button type="button" class="btn-descargar" onclick="descargarDesprendiblePorId(${desprendible.id})">
                        Descargar
                    </button>
                `;
                resultadosList.appendChild(div);
            });
        }

        if (searchResults) searchResults.style.display = 'block';
    } catch (error) {
        alert('Error al buscar: ' + error.message);
    }
}

async function descargarDesprendiblePorId(id) {
    try {
        const todos = await bd.obtenerTodos();
        const desprendible = todos.find(d => d.id === id);
        
        if (desprendible) {
            descargarExcelOriginal(desprendible);
        } else {
            alert('No se pudo encontrar el desprendible');
        }
    } catch (error) {
        alert('Error al descargar: ' + error.message);
    }
}

async function descargarPDFEmpleado(cedula, periodo) {
    try {
        const desprendibles = await bd.obtenerPorCedula(cedula);
        const desprendible = desprendibles.find(d => d.periodo === periodo);
        
        if (desprendible) {
            descargarExcelOriginal(desprendible);
        } else {
            alert('No se pudo encontrar el desprendible');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function irAEmpleados() {
    window.location.href = 'empleados.html';
}

// Utilidades
async function resetearBaseDatos() {
    if (confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los desprendibles guardados.')) {
        try {
            await bd.limpiar();
            alert('✅ Base de datos limpiada. La página se recargará.');
            location.reload();
        } catch (error) {
            alert('Error al limpiar: ' + error.message);
        }
    }
}

async function eliminarBaseDatosCompleta() {
    if (confirm('⚠️⚠️⚠️ ADVERTENCIA ⚠️⚠️⚠️\n\nEsto eliminará COMPLETAMENTE la base de datos.\n\n¿Estás seguro?')) {
        try {
            if (bd.db) {
                bd.db.close();
            }
            
            const request = indexedDB.deleteDatabase('AGROPALMA_DB');
            
            request.onsuccess = () => {
                alert('✅ Base de datos eliminada. La página se recargará.');
                location.reload();
            };
            
            request.onerror = () => {
                alert('❌ Error al eliminar la base de datos');
            };
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

window.resetearBaseDatos = resetearBaseDatos;
window.eliminarBaseDatosCompleta = eliminarBaseDatosCompleta;
window.bd = bd;

console.log('💡 Sistema AGROPALMA - Carga y descarga de Excel');
console.log('✅ Excel se guarda sin modificar');
console.log('✅ Excel se descarga sin modificar');
console.log('🔒 Prevención de duplicados activada');
console.log('🔐 Base de datos protegida con contraseña');

// ============================================================
// ⚠️ CONFIGURACIÓN DE SEGURIDAD - IMPORTANTE
// ============================================================
// Para cambiar la contraseña de la base de datos, busca esta línea
// en la función verBaseDatos():
// const contraseñaCorrecta = 'admin123';
//
// Esta debe ser LA MISMA contraseña que usas para entrar a 
// la sección de administración de tu sitio.
// ============================================================

// ============================================================
// FUNCIÓN: Ver base de datos completa (CON CONTRASEÑA)
// ============================================================
async function verBaseDatos() {
    // Solicitar contraseña
    const contraseñaIngresada = prompt('🔒 Ingresa la contraseña de administración:');
    
    // ============================================================
    // ⚠️ CAMBIAR AQUÍ LA CONTRASEÑA
    // Debe ser la misma que usas para acceder a administración
    // ============================================================
    const contraseñaCorrecta = 'agropalma2024'; 
    // ============================================================
    
    if (contraseñaIngresada !== contraseñaCorrecta) {
        alert('❌ Contraseña incorrecta. Acceso denegado.');
        return;
    }
    
    try {
        const desprendibles = await bd.obtenerTodos();
        
        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'modalBaseDatos';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const contenido = document.createElement('div');
        contenido.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 30px;
            max-width: 90%;
            max-height: 85%;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        `;
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px;">
                <h2 style="margin: 0; color: #1e3a8a; font-size: 28px;">
                    🔒 Base de Datos AGROPALMA
                </h2>
                <button onclick="cerrarModalBaseDatos()" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.2s;
                ">
                    ✕ Cerrar
                </button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${desprendibles.length}</div>
                        <div style="font-size: 14px; opacity: 0.9;">Total Desprendibles</div>
                    </div>
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${new Set(desprendibles.map(d => d.cedula)).size}</div>
                        <div style="font-size: 14px; opacity: 0.9;">Empleados</div>
                    </div>
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${(desprendibles.reduce((sum, d) => sum + (d.archivoSize || 0), 0) / 1024).toFixed(2)}</div>
                        <div style="font-size: 14px; opacity: 0.9;">KB Totales</div>
                    </div>
                </div>
            </div>
        `;
        
        if (desprendibles.length === 0) {
            html += `
                <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📂</div>
                    <h3 style="color: #374151; margin-bottom: 10px;">Base de datos vacía</h3>
                    <p>No hay desprendibles guardados aún.</p>
                    <p style="font-size: 14px; margin-top: 20px;">
                        Puedes cargar desprendibles desde el <strong>Panel de Administración</strong>
                    </p>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="exportarJSON()" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s;
                    ">
                        📥 Exportar JSON
                    </button>
                    <button onclick="exportarCSV()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s;
                    ">
                        📊 Exportar CSV
                    </button>
                </div>
                
                <div style="overflow-x: auto; border-radius: 10px; border: 1px solid #e5e7eb;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">ID</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Nombre</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Cédula</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Período</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Archivo</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Tamaño</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Fecha Carga</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            desprendibles.forEach((desp, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                const tamañoKB = desp.archivoSize ? (desp.archivoSize / 1024).toFixed(2) : 'N/A';
                
                html += `
                    <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 12px; color: #6b7280;">${desp.id}</td>
                        <td style="padding: 12px; color: #111827; font-weight: 500;">${desp.nombre}</td>
                        <td style="padding: 12px; color: #374151;">${desp.cedula}</td>
                        <td style="padding: 12px; color: #374151;">${desp.periodoTexto}</td>
                        <td style="padding: 12px; color: #6b7280; font-size: 12px;">${desp.archivo}</td>
                        <td style="padding: 12px; color: #6b7280;">${tamañoKB} KB</td>
                        <td style="padding: 12px; color: #6b7280;">${desp.fechaCarga}</td>
                        <td style="padding: 12px;">
                            <button onclick="descargarDesdeModal(${desp.id})" style="
                                background: #22c55e;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-right: 5px;
                            ">
                                ⬇️
                            </button>
                            <button onclick="eliminarDesdeModal(${desp.id})" style="
                                background: #ef4444;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 12px;
                            ">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        contenido.innerHTML = html;
        modal.appendChild(contenido);
        document.body.appendChild(modal);
        
        // Agregar animaciones
        const styleAnimations = document.createElement('style');
        styleAnimations.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    transform: translateY(50px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleAnimations);
        
    } catch (error) {
        alert('❌ Error al cargar la base de datos: ' + error.message);
        console.error(error);
    }
}

function cerrarModalBaseDatos() {
    const modal = document.getElementById('modalBaseDatos');
    if (modal) {
        modal.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => modal.remove(), 300);
    }
}

async function descargarDesdeModal(id) {
    try {
        const todos = await bd.obtenerTodos();
        const desprendible = todos.find(d => d.id === id);
        
        if (desprendible) {
            descargarExcelOriginal(desprendible);
        } else {
            alert('❌ No se encontró el desprendible');
        }
    } catch (error) {
        alert('❌ Error al descargar: ' + error.message);
    }
}

async function eliminarDesdeModal(id) {
    if (confirm('⚠️ ¿Estás seguro de eliminar este desprendible?')) {
        try {
            await bd.eliminar(id);
            alert('✅ Desprendible eliminado');
            
            // Cerrar y reabrir modal para actualizar
            cerrarModalBaseDatos();
            setTimeout(() => verBaseDatos(), 400);
        } catch (error) {
            alert('❌ Error al eliminar: ' + error.message);
        }
    }
}

async function exportarJSON() {
    try {
        const desprendibles = await bd.obtenerTodos();
        
        // Crear copia sin el ArrayBuffer (muy grande para JSON)
        const datosExportar = desprendibles.map(d => ({
            id: d.id,
            nombre: d.nombre,
            cedula: d.cedula,
            periodo: d.periodo,
            periodoTexto: d.periodoTexto,
            archivo: d.archivo,
            archivoSize: d.archivoSize,
            fechaCarga: d.fechaCarga,
            estado: d.estado,
            tieneArchivo: !!d.archivoBlob
        }));
        
        const json = JSON.stringify(datosExportar, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AGROPALMA_BD_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ JSON exportado correctamente');
    } catch (error) {
        alert('❌ Error al exportar: ' + error.message);
    }
}

async function exportarCSV() {
    try {
        const desprendibles = await bd.obtenerTodos();
        
        let csv = 'ID,Nombre,Cédula,Período,Archivo,Tamaño (KB),Fecha Carga,Estado\n';
        
        desprendibles.forEach(d => {
            const tamaño = d.archivoSize ? (d.archivoSize / 1024).toFixed(2) : 'N/A';
            csv += `${d.id},"${d.nombre}",${d.cedula},"${d.periodoTexto}","${d.archivo}",${tamaño},${d.fechaCarga},${d.estado}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AGROPALMA_BD_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ CSV exportado correctamente');
    } catch (error) {
        alert('❌ Error al exportar: ' + error.message);
    }
}

// ============================================================
// AGREGAR BOTÓN FLOTANTE PARA VER BASE DE DATOS (SOLO ADMIN)
// ============================================================
function crearBotonBaseDatos() {
    // Verificar si estamos en la página de administración
    const esAdministracion = 
        window.location.pathname.includes('admin') || 
        window.location.pathname.includes('administracion') ||
        document.getElementById('empresaForm') !== null ||
        document.querySelector('[data-tab="empresa"]') !== null;
    
    // Solo crear el botón si estamos en administración
    if (!esAdministracion) {
        console.log('⚠️ Botón de base de datos solo disponible en administración');
        return;
    }
    
    const boton = document.createElement('button');
    boton.id = 'btnVerBaseDatos';
    boton.innerHTML = '📊';
    boton.title = 'Ver Base de Datos';
    boton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        z-index: 9999;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    boton.onmouseover = () => {
        boton.style.transform = 'scale(1.1)';
        boton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    };
    
    boton.onmouseout = () => {
        boton.style.transform = 'scale(1)';
        boton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };
    
    boton.onclick = verBaseDatos;
    
    document.body.appendChild(boton);
    console.log('✅ Botón de base de datos creado (solo visible en administración)');
}

// Crear el botón cuando cargue la página
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(crearBotonBaseDatos, 1000);
});

// Exportar funciones globales
window.verBaseDatos = verBaseDatos;
window.cerrarModalBaseDatos = cerrarModalBaseDatos;
window.descargarDesdeModal = descargarDesdeModal;
window.eliminarDesdeModal = eliminarDesdeModal;
window.exportarJSON = exportarJSON;
window.exportarCSV = exportarCSV;



