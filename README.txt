PROTOTIPO FUNCIONAL — GESTIÓN ACADÉMICA
Proyecto Integrador · Fase 2

MÓDULOS IMPLEMENTADOS
1. Pantalla de bienvenida y acceso al prototipo.
2. Creación y edición de perfil del estudiante (almacenamiento local).
3. Inicio dinámico con contadores de tareas, evaluaciones y alertas.
4. Próximas actividades combinando clases, tareas, evaluaciones y recordatorios.
5. Horario académico:
   - Visualización por día.
   - Crear, editar y eliminar clases.
   - Validación de horas y detección de choques de horario.
6. Tareas:
   - Crear, editar y eliminar.
   - Prioridad alta/media/baja.
   - Fecha límite y notas.
   - Marcar como completada o reabrir.
   - Filtros: pendientes, completadas y todas.
7. Evaluaciones:
   - Crear, editar y eliminar.
   - Tipo, fecha, hora, lugar y porcentaje.
   - Marcar como realizada o pendiente.
   - Indicador de próxima evaluación.
8. Recordatorios:
   - Crear, editar, eliminar, activar y desactivar.
   - Fecha, hora, categoría y notas.
   - Solicitud opcional de notificaciones del navegador.
   - Los avisos del sistema funcionan mientras la aplicación está abierta y el navegador concede permiso.
9. Perfil y mantenimiento:
   - Editar datos personales académicos.
   - Exportar respaldo JSON.
   - Importar respaldo JSON.
   - Restablecer datos de demostración.
10. Persistencia local con localStorage: los cambios se conservan al recargar.
11. Diseño responsive para PC y teléfono.

CÓMO ABRIRLO
- En Windows: doble clic en index.html.
- Para una demostración más estable y para habilitar mejor las funciones del navegador:
  python -m http.server 8000
  Luego abrir http://localhost:8000

FLUJO SUGERIDO PARA PRESENTAR
1. Abrir index.html y entrar al prototipo.
2. Mostrar el inicio y sus contadores dinámicos.
3. Entrar a Horario, agregar una clase y luego editarla.
4. Entrar a Tareas, crear una tarea y marcarla como completada.
5. Agregar una evaluación y mostrar el indicador de próxima evaluación.
6. Crear un recordatorio y activar/desactivar la alerta.
7. Crear o editar el perfil.
8. Mostrar que los datos persisten al recargar la página.
9. Opcional: exportar un respaldo desde Perfil.

NOTA TÉCNICA
Este prototipo no utiliza servidor ni base de datos remota. Toda la información se almacena localmente en el navegador. Para una fase posterior se puede conectar a una API/backend y una base de datos real, implementar autenticación institucional y notificaciones push en segundo plano.
