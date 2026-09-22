'use strict';

const STORAGE={
  schedule:'ga_schedule',tasks:'ga_tasks',evaluations:'ga_evaluations',reminders:'ga_reminders',profile:'ga_profile'
};
const colorMap={blue:'#24558d',green:'#2da56f',orange:'#f39a27',red:'#bf1230',purple:'#7a54bd'};
const screens=[...document.querySelectorAll('.screen')];
const toast=document.getElementById('toast');
let selectedDay='Mié';
let taskFilter='pending';
let profileReturnScreen='welcomeScreen';
let toastTimer;

function uid(prefix='id'){return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2,7)}`;}
function isoDate(date){return date.toISOString().slice(0,10);}
function datePlus(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return isoDate(d);}
function nextHour(minutes=60){const d=new Date(Date.now()+minutes*60000);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}

function defaultClasses(){return [
  {id:'class_1',day:'Mié',start:'08:00',end:'09:30',subject:'Programación Móvil',place:'Aula 23',color:'blue'},
  {id:'class_2',day:'Mié',start:'10:00',end:'11:30',subject:'Base de Datos II',place:'Lab. 15',color:'green'},
  {id:'class_3',day:'Mié',start:'14:00',end:'15:30',subject:'Ingeniería de Software II',place:'Aula 21',color:'orange'},
  {id:'class_4',day:'Mié',start:'16:00',end:'17:00',subject:'Proyecto Integrador II',place:'Laboratorio',color:'red'}
];}
function defaultTasks(){return [
  {id:'task_1',title:'Entregar avance del proyecto',subject:'Proyecto Integrador II',dueDate:datePlus(1),priority:'high',notes:'Revisar requisitos y adjuntar documentación.',done:false},
  {id:'task_2',title:'Completar ejercicio de consultas',subject:'Base de Datos II',dueDate:datePlus(3),priority:'medium',notes:'Resolver consultas SQL pendientes.',done:false},
  {id:'task_3',title:'Lectura de arquitectura móvil',subject:'Programación Móvil',dueDate:datePlus(5),priority:'low',notes:'Preparar ideas principales para discusión.',done:false}
];}
function defaultEvaluations(){return [
  {id:'eval_1',title:'Segundo parcial',subject:'Base de Datos II',date:datePlus(2),time:'10:00',type:'Examen',weight:'25',place:'Lab. 15',completed:false},
  {id:'eval_2',title:'Defensa de avance',subject:'Proyecto Integrador II',date:datePlus(7),time:'16:00',type:'Defensa',weight:'20',place:'Laboratorio',completed:false}
];}
function defaultReminders(){return [
  {id:'rem_1',title:'Llevar memoria USB al laboratorio',date:datePlus(1),time:'07:30',category:'Académico',notes:'Contiene el respaldo del proyecto.',enabled:true,notifiedAt:null},
  {id:'rem_2',title:'Revisar material del parcial',date:datePlus(2),time:'18:00',category:'Evaluación',notes:'Repasar normalización y procedimientos.',enabled:true,notifiedAt:null}
];}

function readArray(key,fallbackFactory){
  try{const parsed=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(parsed)?parsed:fallbackFactory();}
  catch{return fallbackFactory();}
}
function readObject(key){
  try{const parsed=JSON.parse(localStorage.getItem(key)||'null');return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null;}
  catch{return null;}
}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));}

let classes=readArray(STORAGE.schedule,defaultClasses);
let tasks=readArray(STORAGE.tasks,defaultTasks);
let evaluations=readArray(STORAGE.evaluations,defaultEvaluations);
let reminders=readArray(STORAGE.reminders,defaultReminders);
let profile=readObject(STORAGE.profile);

function persistAll(){
  write(STORAGE.schedule,classes);write(STORAGE.tasks,tasks);write(STORAGE.evaluations,evaluations);write(STORAGE.reminders,reminders);
  if(profile)write(STORAGE.profile,profile);else localStorage.removeItem(STORAGE.profile);
}

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function fmtTime(t){
  if(!t)return '';
  const [h,m]=t.split(':').map(Number),ap=h>=12?'PM':'AM',hh=((h+11)%12)+1;
  return `${hh}:${String(m).padStart(2,'0')} ${ap}`;
}
function parseLocal(date,time='23:59'){const d=new Date(`${date}T${time}:00`);return Number.isNaN(d.getTime())?null:d;}
function fmtDate(date){
  const d=parseLocal(date,'12:00');
  return d?new Intl.DateTimeFormat('es-NI',{weekday:'short',day:'numeric',month:'short'}).format(d):date;
}
function relativeDate(date,time='23:59'){
  const target=parseLocal(date,time);if(!target)return '';
  const now=new Date();
  const startNow=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const startTarget=new Date(target.getFullYear(),target.getMonth(),target.getDate());
  const days=Math.round((startTarget-startNow)/86400000);
  if(days<0)return `Vencida hace ${Math.abs(days)} día${Math.abs(days)===1?'':'s'}`;
  if(days===0)return 'Hoy';if(days===1)return 'Mañana';return `En ${days} días`;
}
function notify(msg){
  clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('show');
  toastTimer=setTimeout(()=>toast.classList.remove('show'),1900);
}
function todayLong(){return new Intl.DateTimeFormat('es-NI',{weekday:'long',day:'numeric',month:'long'}).format(new Date());}

function navMarkup(active){
  const items=[['homeScreen','⌂','Inicio'],['scheduleScreen','▦','Horario'],['tasksScreen','☷','Tareas'],['remindersScreen','♢','Alertas'],['profileScreen','○','Perfil']];
  return items.map(([id,icon,label])=>`<button data-go="${id}" class="${active===id?'active':''}">${icon}<span>${label}</span></button>`).join('');
}
document.querySelectorAll('.bottom-nav').forEach(nav=>nav.innerHTML=navMarkup(nav.dataset.nav));

function show(id){
  const target=document.getElementById(id);if(!target)return;
  screens.forEach(s=>s.classList.toggle('active',s.id===id));
  const content=target.querySelector('.scrollable');if(content)content.scrollTop=0;
  if(id==='homeScreen')renderDashboard();
  if(id==='scheduleScreen')renderSchedule();
  if(id==='tasksScreen')renderTasks();
  if(id==='evaluationsScreen')renderEvaluations();
  if(id==='remindersScreen')renderReminders();
  if(id==='profileScreen')renderProfile();
}

document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-go]');
  if(nav&&!nav.disabled){e.preventDefault();show(nav.dataset.go);}
});

document.getElementById('enterBtn').addEventListener('click',()=>show('homeScreen'));
document.getElementById('createBtn').addEventListener('click',()=>openProfileForm('welcomeScreen'));
document.getElementById('logoutBtn').addEventListener('click',()=>show('welcomeScreen'));

// ---------- INICIO ----------
function nextClassOccurrence(c){
  const dayMap={Lun:1,Mar:2,'Mié':3,Jue:4,Vie:5};
  const targetDay=dayMap[c.day];if(!targetDay)return null;
  const now=new Date();const result=new Date(now);result.setSeconds(0,0);
  let delta=(targetDay-now.getDay()+7)%7;
  const [h,m]=c.start.split(':').map(Number);
  if(delta===0&&(h<now.getHours()||(h===now.getHours()&&m<=now.getMinutes())))delta=7;
  result.setDate(now.getDate()+delta);result.setHours(h,m,0,0);return result;
}
function getUpcomingActivities(){
  const now=new Date();const arr=[];
  tasks.filter(t=>!t.done).forEach(t=>{const d=parseLocal(t.dueDate,'23:59');if(d)arr.push({date:d,title:t.title,sub:`Tarea · ${t.subject}`,kind:'Tarea',color:t.priority==='high'?'red':t.priority==='low'?'green':'orange'});});
  evaluations.filter(v=>!v.completed).forEach(v=>{const d=parseLocal(v.date,v.time||'08:00');if(d&&d>=new Date(now.getTime()-86400000))arr.push({date:d,title:v.title,sub:`${v.type} · ${v.subject}`,kind:'Evaluación',color:'purple'});});
  reminders.filter(r=>r.enabled).forEach(r=>{const d=parseLocal(r.date,r.time||'08:00');if(d&&d>=new Date(now.getTime()-86400000))arr.push({date:d,title:r.title,sub:`Recordatorio · ${r.category}`,kind:'Alerta',color:'blue'});});
  classes.forEach(c=>{const d=nextClassOccurrence(c);if(d)arr.push({date:d,title:c.subject,sub:`Clase · ${c.place}`,kind:'Clase',color:c.color||'blue'});});
  return arr.sort((a,b)=>a.date-b.date).slice(0,5);
}
function renderDashboard(){
  const pending=tasks.filter(t=>!t.done).length;
  const now=new Date();
  const upcomingEval=evaluations.filter(v=>!v.completed&&parseLocal(v.date,v.time||'23:59')>=now).length;
  const activeReminders=reminders.filter(r=>r.enabled).length;
  document.getElementById('pendingCount').textContent=pending;
  document.getElementById('evaluationCount').textContent=upcomingEval;
  document.getElementById('alertCount').textContent=activeReminders;
  document.getElementById('greeting').textContent=`¡Hola, ${profile?.name?.trim().split(/\s+/)[0]||'estudiante'}!`;
  document.getElementById('todayLabel').textContent=`${todayLong()}. Revisa tus próximas actividades.`;
  const upcoming=getUpcomingActivities();
  document.getElementById('nextActivitiesCount').textContent=upcoming.length?`${upcoming.length} próximas`:'';
  const box=document.getElementById('nextActivities');
  if(!upcoming.length){box.innerHTML='<div class="empty-state" style="margin-top:12px"><span>🌿</span><b>Sin actividades próximas</b><small>Tu agenda está despejada.</small></div>';return;}
  box.innerHTML=upcoming.map(a=>`<div class="next-card"><span class="dot ${escapeHtml(a.color)}"></span><div><b>${escapeHtml(a.title)}</b><small>${escapeHtml(a.sub)} · ${escapeHtml(fmtDate(isoDate(a.date)))} ${escapeHtml(fmtTime(`${String(a.date.getHours()).padStart(2,'0')}:${String(a.date.getMinutes()).padStart(2,'0')}`))}</small></div><span class="tag">${escapeHtml(a.kind)}</span></div>`).join('');
}

// ---------- HORARIO ----------
function renderSchedule(){
  document.querySelectorAll('#daysBar button').forEach(b=>b.classList.toggle('active',b.dataset.day===selectedDay));
  const list=document.getElementById('scheduleList'),empty=document.getElementById('emptyState');
  const items=classes.filter(c=>c.day===selectedDay).sort((a,b)=>a.start.localeCompare(b.start));
  list.innerHTML='';empty.classList.toggle('hidden',items.length>0);
  items.forEach(c=>{
    const row=document.createElement('div');row.className='schedule-row';
    row.innerHTML=`<div class="time">${fmtTime(c.start)}<br>– ${fmtTime(c.end)}</div><div class="class-card" style="--cardColor:${colorMap[c.color]||colorMap.blue}"><b>${escapeHtml(c.subject)}</b><small>${escapeHtml(c.place)}</small><div class="class-actions"><button class="edit-btn" data-edit-class="${escapeHtml(c.id)}">Editar</button><button class="delete-btn" data-del-class="${escapeHtml(c.id)}">Eliminar</button></div></div>`;
    list.appendChild(row);
  });
}
document.querySelectorAll('#daysBar button').forEach(b=>b.addEventListener('click',()=>{selectedDay=b.dataset.day;renderSchedule();}));
document.getElementById('addClassBtn').addEventListener('click',()=>openClassForm());
function openClassForm(item=null){
  const form=document.getElementById('classForm');form.reset();form.dataset.editId=item?.id||'';
  document.getElementById('classFormTitle').textContent=item?'Editar clase':'Registrar clase';
  form.elements.day.value=item?.day||selectedDay;form.elements.start.value=item?.start||'08:00';form.elements.end.value=item?.end||'09:30';
  form.elements.subject.value=item?.subject||'';form.elements.place.value=item?.place||'';form.elements.color.value=item?.color||'blue';show('captureScreen');
}
function hasClassConflict(candidate,editId=''){
  return classes.some(c=>String(c.id)!==String(editId)&&c.day===candidate.day&&candidate.start<c.end&&candidate.end>c.start);
}
document.getElementById('classForm').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget,obj=Object.fromEntries(new FormData(form).entries()),editId=form.dataset.editId;
  if(obj.end<=obj.start){notify('La hora final debe ser mayor que la hora inicial');return;}
  if(hasClassConflict(obj,editId)){notify('Existe otra clase que se cruza con ese horario');return;}
  if(editId){classes=classes.map(c=>String(c.id)===String(editId)?{...c,...obj}:c);notify('Clase actualizada');}
  else{classes.push({...obj,id:uid('class')});notify('Clase guardada correctamente');}
  write(STORAGE.schedule,classes);selectedDay=obj.day;show('scheduleScreen');
});
document.getElementById('scheduleList').addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-class]'),del=e.target.closest('[data-del-class]');
  if(edit){const item=classes.find(c=>String(c.id)===String(edit.dataset.editClass));if(item)openClassForm(item);}
  if(del&&confirm('¿Eliminar esta clase del horario?')){classes=classes.filter(c=>String(c.id)!==String(del.dataset.delClass));write(STORAGE.schedule,classes);renderSchedule();notify('Clase eliminada');}
});

// ---------- TAREAS ----------
function priorityText(p){return p==='high'?'Alta':p==='low'?'Baja':'Media';}
function renderTasks(){
  document.querySelectorAll('#taskFilter button').forEach(b=>b.classList.toggle('active',b.dataset.filter===taskFilter));
  let items=[...tasks];if(taskFilter==='pending')items=items.filter(t=>!t.done);if(taskFilter==='done')items=items.filter(t=>t.done);
  items.sort((a,b)=>Number(a.done)-Number(b.done)||String(a.dueDate).localeCompare(String(b.dueDate)));
  const list=document.getElementById('taskList'),empty=document.getElementById('taskEmpty');empty.classList.toggle('hidden',items.length>0);
  list.innerHTML=items.map(t=>{
    const overdue=!t.done&&parseLocal(t.dueDate,'23:59')<new Date();
    return `<article class="item-card ${t.done?'completed':''}"><div class="item-head"><div><div class="item-title">${escapeHtml(t.title)}</div><span class="item-sub">${escapeHtml(t.subject)}</span></div><span class="tag ${t.done?'done':overdue?'overdue':'blue'}">${t.done?'Completada':overdue?'Vencida':escapeHtml(relativeDate(t.dueDate))}</span></div><div class="item-meta"><span class="tag ${escapeHtml(t.priority)}">Prioridad ${priorityText(t.priority)}</span><span class="tag">📅 ${escapeHtml(fmtDate(t.dueDate))}</span></div>${t.notes?`<p class="item-notes">${escapeHtml(t.notes)}</p>`:''}<div class="item-actions"><button class="${t.done?'undo-btn':'done-btn'}" data-toggle-task="${escapeHtml(t.id)}">${t.done?'Reabrir':'Completar'}</button><button class="edit-btn" data-edit-task="${escapeHtml(t.id)}">Editar</button><button class="delete-btn" data-del-task="${escapeHtml(t.id)}">Eliminar</button></div></article>`;
  }).join('');
}
document.getElementById('taskFilter').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){taskFilter=b.dataset.filter;renderTasks();}});
document.getElementById('addTaskBtn').addEventListener('click',()=>openTaskForm());
function openTaskForm(item=null){
  const form=document.getElementById('taskForm');form.reset();form.dataset.editId=item?.id||'';document.getElementById('taskFormTitle').textContent=item?'Editar tarea':'Nueva tarea';
  form.elements.title.value=item?.title||'';form.elements.subject.value=item?.subject||'';form.elements.dueDate.value=item?.dueDate||datePlus(1);form.elements.priority.value=item?.priority||'medium';form.elements.notes.value=item?.notes||'';show('taskFormScreen');
}
document.getElementById('taskForm').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget,obj=Object.fromEntries(new FormData(form).entries()),editId=form.dataset.editId;
  if(editId){tasks=tasks.map(t=>String(t.id)===String(editId)?{...t,...obj}:t);notify('Tarea actualizada');}
  else{tasks.push({...obj,id:uid('task'),done:false});notify('Tarea creada');}
  write(STORAGE.tasks,tasks);show('tasksScreen');
});
document.getElementById('taskList').addEventListener('click',e=>{
  const toggle=e.target.closest('[data-toggle-task]'),edit=e.target.closest('[data-edit-task]'),del=e.target.closest('[data-del-task]');
  if(toggle){tasks=tasks.map(t=>String(t.id)===String(toggle.dataset.toggleTask)?{...t,done:!t.done}:t);write(STORAGE.tasks,tasks);renderTasks();notify('Estado de tarea actualizado');}
  if(edit){const item=tasks.find(t=>String(t.id)===String(edit.dataset.editTask));if(item)openTaskForm(item);}
  if(del&&confirm('¿Eliminar esta tarea?')){tasks=tasks.filter(t=>String(t.id)!==String(del.dataset.delTask));write(STORAGE.tasks,tasks);renderTasks();notify('Tarea eliminada');}
});

// ---------- EVALUACIONES ----------
function renderEvaluations(){
  const now=new Date();const items=[...evaluations].sort((a,b)=>Number(a.completed)-Number(b.completed)||(parseLocal(a.date,a.time)-parseLocal(b.date,b.time)));
  const list=document.getElementById('evaluationList'),empty=document.getElementById('evaluationEmpty');empty.classList.toggle('hidden',items.length>0);
  list.innerHTML=items.map(v=>{
    const passed=!v.completed&&parseLocal(v.date,v.time)<now;
    return `<article class="item-card ${v.completed?'completed':''}"><div class="item-head"><div><div class="item-title">${escapeHtml(v.title)}</div><span class="item-sub">${escapeHtml(v.subject)}</span></div><span class="tag ${v.completed?'done':passed?'overdue':'blue'}">${v.completed?'Realizada':passed?'Fecha pasada':escapeHtml(relativeDate(v.date,v.time))}</span></div><div class="item-meta"><span class="tag">${escapeHtml(v.type)}</span><span class="tag">📅 ${escapeHtml(fmtDate(v.date))}</span><span class="tag">🕒 ${fmtTime(v.time)}</span>${v.weight!==''?`<span class="tag">${escapeHtml(v.weight)}%</span>`:''}</div>${v.place?`<p class="item-notes">Lugar: ${escapeHtml(v.place)}</p>`:''}<div class="item-actions"><button class="${v.completed?'undo-btn':'done-btn'}" data-toggle-eval="${escapeHtml(v.id)}">${v.completed?'Marcar pendiente':'Marcar realizada'}</button><button class="edit-btn" data-edit-eval="${escapeHtml(v.id)}">Editar</button><button class="delete-btn" data-del-eval="${escapeHtml(v.id)}">Eliminar</button></div></article>`;
  }).join('');
  const next=evaluations.filter(v=>!v.completed&&parseLocal(v.date,v.time)>=now).sort((a,b)=>parseLocal(a.date,a.time)-parseLocal(b.date,b.time))[0];
  document.getElementById('nextEvaluationTitle').textContent=next?next.title:'Sin evaluaciones próximas';
  document.getElementById('nextEvaluationInfo').textContent=next?`${next.subject} · ${fmtDate(next.date)} · ${fmtTime(next.time)}`:'Agrega una evaluación para comenzar.';
}
document.getElementById('addEvaluationBtn').addEventListener('click',()=>openEvaluationForm());
function openEvaluationForm(item=null){
  const form=document.getElementById('evaluationForm');form.reset();form.dataset.editId=item?.id||'';document.getElementById('evaluationFormTitle').textContent=item?'Editar evaluación':'Nueva evaluación';
  form.elements.title.value=item?.title||'';form.elements.subject.value=item?.subject||'';form.elements.date.value=item?.date||datePlus(2);form.elements.time.value=item?.time||'08:00';form.elements.type.value=item?.type||'Examen';form.elements.weight.value=item?.weight??'20';form.elements.place.value=item?.place||'';show('evaluationFormScreen');
}
document.getElementById('evaluationForm').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget,obj=Object.fromEntries(new FormData(form).entries()),editId=form.dataset.editId;
  const weight=Number(obj.weight);if(obj.weight!==''&&(weight<0||weight>100)){notify('El valor debe estar entre 0% y 100%');return;}
  if(editId){evaluations=evaluations.map(v=>String(v.id)===String(editId)?{...v,...obj}:v);notify('Evaluación actualizada');}
  else{evaluations.push({...obj,id:uid('eval'),completed:false});notify('Evaluación agregada');}
  write(STORAGE.evaluations,evaluations);show('evaluationsScreen');
});
document.getElementById('evaluationList').addEventListener('click',e=>{
  const toggle=e.target.closest('[data-toggle-eval]'),edit=e.target.closest('[data-edit-eval]'),del=e.target.closest('[data-del-eval]');
  if(toggle){evaluations=evaluations.map(v=>String(v.id)===String(toggle.dataset.toggleEval)?{...v,completed:!v.completed}:v);write(STORAGE.evaluations,evaluations);renderEvaluations();notify('Estado de evaluación actualizado');}
  if(edit){const item=evaluations.find(v=>String(v.id)===String(edit.dataset.editEval));if(item)openEvaluationForm(item);}
  if(del&&confirm('¿Eliminar esta evaluación?')){evaluations=evaluations.filter(v=>String(v.id)!==String(del.dataset.delEval));write(STORAGE.evaluations,evaluations);renderEvaluations();notify('Evaluación eliminada');}
});

// ---------- RECORDATORIOS ----------
function notificationText(){
  if(!('Notification' in window))return 'Este navegador no ofrece notificaciones del sistema.';
  if(Notification.permission==='granted')return 'Notificaciones activadas mientras la aplicación esté abierta.';
  if(Notification.permission==='denied')return 'Permiso bloqueado en la configuración del navegador.';
  return 'Puedes activar avisos mientras la app esté abierta.';
}
function renderReminders(){
  const items=[...reminders].sort((a,b)=>parseLocal(a.date,a.time)-parseLocal(b.date,b.time));
  const list=document.getElementById('reminderList'),empty=document.getElementById('reminderEmpty');empty.classList.toggle('hidden',items.length>0);
  document.getElementById('notificationStatus').textContent=notificationText();
  const notifBtn=document.getElementById('enableNotificationsBtn');notifBtn.textContent=('Notification' in window&&Notification.permission==='granted')?'Activadas':'Activar';
  list.innerHTML=items.map(r=>{
    const passed=parseLocal(r.date,r.time)<new Date();
    return `<article class="item-card ${r.enabled?'':'completed'}"><div class="item-head"><div><div class="item-title">${escapeHtml(r.title)}</div><span class="item-sub">${escapeHtml(r.category)}</span></div><span class="tag ${!r.enabled?'done':passed?'overdue':'blue'}">${!r.enabled?'Desactivado':passed?'Fecha pasada':escapeHtml(relativeDate(r.date,r.time))}</span></div><div class="item-meta"><span class="tag">📅 ${escapeHtml(fmtDate(r.date))}</span><span class="tag">🕒 ${fmtTime(r.time)}</span></div>${r.notes?`<p class="item-notes">${escapeHtml(r.notes)}</p>`:''}<div class="item-actions"><button class="toggle-btn ${r.enabled?'on':''}" data-toggle-rem="${escapeHtml(r.id)}">${r.enabled?'● Activo':'○ Inactivo'}</button><button class="edit-btn" data-edit-rem="${escapeHtml(r.id)}">Editar</button><button class="delete-btn" data-del-rem="${escapeHtml(r.id)}">Eliminar</button></div></article>`;
  }).join('');
}
document.getElementById('enableNotificationsBtn').addEventListener('click',async()=>{
  if(!('Notification' in window)){notify('Las notificaciones no están disponibles en este navegador');return;}
  try{const result=await Notification.requestPermission();renderReminders();notify(result==='granted'?'Notificaciones activadas':'No se concedió permiso para notificaciones');}
  catch{notify('No fue posible solicitar el permiso');}
});
document.getElementById('addReminderBtn').addEventListener('click',()=>openReminderForm());
function openReminderForm(item=null){
  const form=document.getElementById('reminderForm');form.reset();form.dataset.editId=item?.id||'';document.getElementById('reminderFormTitle').textContent=item?'Editar recordatorio':'Nuevo recordatorio';
  form.elements.title.value=item?.title||'';form.elements.date.value=item?.date||datePlus(1);form.elements.time.value=item?.time||nextHour(120);form.elements.category.value=item?.category||'Académico';form.elements.notes.value=item?.notes||'';form.elements.enabled.checked=item?.enabled??true;show('reminderFormScreen');
}
document.getElementById('reminderForm').addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget,fd=new FormData(form),obj=Object.fromEntries(fd.entries()),editId=form.dataset.editId;obj.enabled=form.elements.enabled.checked;
  if(editId){reminders=reminders.map(r=>String(r.id)===String(editId)?{...r,...obj,notifiedAt:null}:r);notify('Recordatorio actualizado');}
  else{reminders.push({...obj,id:uid('rem'),notifiedAt:null});notify('Recordatorio creado');}
  write(STORAGE.reminders,reminders);show('remindersScreen');
});
document.getElementById('reminderList').addEventListener('click',e=>{
  const toggle=e.target.closest('[data-toggle-rem]'),edit=e.target.closest('[data-edit-rem]'),del=e.target.closest('[data-del-rem]');
  if(toggle){reminders=reminders.map(r=>String(r.id)===String(toggle.dataset.toggleRem)?{...r,enabled:!r.enabled,notifiedAt:null}:r);write(STORAGE.reminders,reminders);renderReminders();notify('Recordatorio actualizado');}
  if(edit){const item=reminders.find(r=>String(r.id)===String(edit.dataset.editRem));if(item)openReminderForm(item);}
  if(del&&confirm('¿Eliminar este recordatorio?')){reminders=reminders.filter(r=>String(r.id)!==String(del.dataset.delRem));write(STORAGE.reminders,reminders);renderReminders();notify('Recordatorio eliminado');}
});
function checkDueReminders(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const now=Date.now();let changed=false;
  reminders=reminders.map(r=>{
    if(!r.enabled||r.notifiedAt)return r;const d=parseLocal(r.date,r.time);if(!d)return r;
    const diff=now-d.getTime();
    if(diff>=0&&diff<=5*60000){new Notification('Gestión Académica',{body:r.title});changed=true;return {...r,notifiedAt:new Date().toISOString()};}
    return r;
  });
  if(changed)write(STORAGE.reminders,reminders);
}

// ---------- PERFIL / RESPALDO ----------
function renderProfile(){
  const name=profile?.name||'Estudiante';document.getElementById('profileName').textContent=name;document.getElementById('profileCareer').textContent=profile?.career||'Perfil de demostración';
  document.getElementById('profileMeta').textContent=profile?`${profile.level||''}${profile.shift?' · '+profile.shift:''}`:'UNAN-León';
  document.getElementById('profileAvatar').textContent=(name.trim()[0]||'E').toUpperCase();
}
function openProfileForm(returnScreen='profileScreen'){
  profileReturnScreen=returnScreen;const form=document.getElementById('profileForm');form.reset();
  document.getElementById('profileFormTitle').textContent=profile?'Editar perfil':'Crear perfil';
  if(profile){for(const [k,v] of Object.entries(profile)){if(form.elements[k])form.elements[k].value=v;}}
  show('profileFormScreen');
}
document.getElementById('cancelProfileBtn').addEventListener('click',()=>show(profileReturnScreen));
document.getElementById('profileForm').addEventListener('submit',e=>{
  e.preventDefault();profile=Object.fromEntries(new FormData(e.currentTarget).entries());write(STORAGE.profile,profile);notify('Perfil guardado');show(profileReturnScreen==='welcomeScreen'?'homeScreen':profileReturnScreen);
});
document.getElementById('editProfileBtn').addEventListener('click',()=>openProfileForm('profileScreen'));
document.getElementById('exportDataBtn').addEventListener('click',()=>{
  const backup={app:'Gestion Academica',version:2,exportedAt:new Date().toISOString(),profile,classes,tasks,evaluations,reminders};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`gestion_academica_respaldo_${isoDate(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Respaldo exportado');
});
document.getElementById('importDataBtn').addEventListener('click',()=>document.getElementById('importFileInput').click());
document.getElementById('importFileInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!data||!Array.isArray(data.classes)||!Array.isArray(data.tasks)||!Array.isArray(data.evaluations)||!Array.isArray(data.reminders))throw new Error('Formato inválido');
    classes=data.classes;tasks=data.tasks;evaluations=data.evaluations;reminders=data.reminders;profile=data.profile&&typeof data.profile==='object'?data.profile:null;persistAll();renderProfile();notify('Respaldo importado correctamente');
  }catch{notify('No se pudo importar: archivo no válido');}
  e.target.value='';
});
document.getElementById('resetDataBtn').addEventListener('click',()=>{
  if(!confirm('¿Restablecer todos los datos del prototipo? Esta acción reemplazará tus cambios locales.'))return;
  classes=defaultClasses();tasks=defaultTasks();evaluations=defaultEvaluations();reminders=defaultReminders();profile=null;persistAll();renderProfile();notify('Datos de demostración restaurados');
});

// ---------- RELOJ / INICIALIZACIÓN ----------
function updateClock(){const d=new Date();document.getElementById('statusTime').textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
updateClock();setInterval(updateClock,30000);setInterval(checkDueReminders,30000);
persistAll();renderDashboard();renderSchedule();renderTasks();renderEvaluations();renderReminders();renderProfile();checkDueReminders();
