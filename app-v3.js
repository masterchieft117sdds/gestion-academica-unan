'use strict';

const APP_VERSION='3.0.0';
const STORAGE_KEY='ga_v3_state';
const LEGACY={schedule:'ga_schedule',tasks:'ga_tasks',evaluations:'ga_evaluations',reminders:'ga_reminders',profile:'ga_profile'};
const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb'];
const COLOR_HEX={blue:'#235b97',green:'#23855e',orange:'#dc831a',red:'#c91f40',purple:'#7653c7',cyan:'#1c8ca8'};
const COLOR_LABEL={blue:'Azul',green:'Verde',orange:'Naranja',red:'Rojo',purple:'Morado',cyan:'Celeste'};

const $=id=>document.getElementById(id);
const $$=sel=>[...document.querySelectorAll(sel)];
const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=(prefix='id')=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const pad=n=>String(n).padStart(2,'0');
const toISODate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseLocal=(date,time='12:00')=>{const d=new Date(`${date}T${time||'12:00'}:00`);return Number.isNaN(d.getTime())?null:d;};
const plusDays=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return toISODate(d);};
const nowTime=()=>`${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
const plusMinutesTime=n=>{const d=new Date(Date.now()+n*60000);return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const fmtTime=t=>{if(!t)return'';const [h,m]=t.split(':').map(Number);return `${((h+11)%12)+1}:${pad(m)} ${h>=12?'PM':'AM'}`;};
const fmtDate=date=>{const d=parseLocal(date);return d?new Intl.DateTimeFormat('es-NI',{day:'numeric',month:'short'}).format(d):date;};
const fmtDateLong=date=>{const d=parseLocal(date);return d?new Intl.DateTimeFormat('es-NI',{weekday:'long',day:'numeric',month:'long'}).format(d):date;};
const fmtMonth=d=>new Intl.DateTimeFormat('es-NI',{month:'long',year:'numeric'}).format(d);
const isSameDate=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const dayDiff=(date)=>{const d=parseLocal(date);if(!d)return 0;return Math.round((startOfDay(d)-startOfDay(new Date()))/86400000);};
const relativeDate=date=>{const n=dayDiff(date);if(n===0)return'Hoy';if(n===1)return'Mañana';if(n===-1)return'Ayer';if(n>1)return`En ${n} días`;return`Hace ${Math.abs(n)} días`;};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const subjectById=id=>state.subjects.find(s=>String(s.id)===String(id));
const subjectName=id=>subjectById(id)?.name||'Sin materia';
const subjectColor=id=>subjectById(id)?.color||'blue';

function defaultState(){
  const subjects=[
    {id:'sub_mobile',name:'Programación Móvil',teacher:'Ing. María López',room:'Aula 23',color:'blue'},
    {id:'sub_db',name:'Base de Datos II',teacher:'Ing. Carlos Ruiz',room:'Lab. 15',color:'green'},
    {id:'sub_soft',name:'Ingeniería de Software II',teacher:'MSc. Laura García',room:'Aula 21',color:'orange'},
    {id:'sub_proj',name:'Proyecto Integrador II',teacher:'Equipo docente',room:'Laboratorio',color:'red'}
  ];
  return {
    version:APP_VERSION,
    profile:{name:'Estudiante',email:'',career:'Ingeniería en Sistemas',level:'4.º año',shift:'Matutino'},
    settings:{darkMode:false,reminderLead:10},
    subjects,
    classes:[
      {id:'class_1',subjectId:'sub_mobile',day:'Mié',start:'08:00',end:'09:30',place:'Aula 23'},
      {id:'class_2',subjectId:'sub_db',day:'Mié',start:'10:00',end:'11:30',place:'Lab. 15'},
      {id:'class_3',subjectId:'sub_soft',day:'Mié',start:'14:00',end:'15:30',place:'Aula 21'},
      {id:'class_4',subjectId:'sub_proj',day:'Mié',start:'16:00',end:'17:00',place:'Laboratorio'},
      {id:'class_5',subjectId:'sub_soft',day:'Lun',start:'09:30',end:'11:00',place:'Aula 21'},
      {id:'class_6',subjectId:'sub_mobile',day:'Vie',start:'08:00',end:'09:30',place:'Aula 23'}
    ],
    tasks:[
      {id:'task_1',title:'Entregar avance del proyecto',subjectId:'sub_proj',dueDate:plusDays(1),dueTime:'23:59',priority:'high',notes:'Revisar requisitos y adjuntar documentación.',done:false,completedAt:null},
      {id:'task_2',title:'Completar ejercicio de consultas',subjectId:'sub_db',dueDate:plusDays(3),dueTime:'18:00',priority:'medium',notes:'Resolver consultas SQL pendientes.',done:false,completedAt:null},
      {id:'task_3',title:'Lectura de arquitectura móvil',subjectId:'sub_mobile',dueDate:plusDays(5),dueTime:'20:00',priority:'low',notes:'Preparar ideas principales para discusión.',done:false,completedAt:null},
      {id:'task_4',title:'Diagrama de componentes',subjectId:'sub_soft',dueDate:plusDays(-1),dueTime:'17:00',priority:'medium',notes:'',done:true,completedAt:new Date().toISOString()}
    ],
    evaluations:[
      {id:'eval_1',title:'Segundo parcial',subjectId:'sub_db',date:plusDays(2),time:'10:00',type:'Examen',weight:25,place:'Lab. 15',completed:false,grade:null,notes:'Normalización, índices y procedimientos.'},
      {id:'eval_2',title:'Defensa de avance',subjectId:'sub_proj',date:plusDays(7),time:'16:00',type:'Defensa',weight:20,place:'Laboratorio',completed:false,grade:null,notes:''},
      {id:'eval_3',title:'Quiz de patrones',subjectId:'sub_soft',date:plusDays(-5),time:'09:30',type:'Quiz',weight:10,place:'Aula 21',completed:true,grade:88,notes:''},
      {id:'eval_4',title:'Práctica UI móvil',subjectId:'sub_mobile',date:plusDays(-9),time:'08:00',type:'Práctica',weight:15,place:'Aula 23',completed:true,grade:92,notes:''}
    ],
    reminders:[
      {id:'rem_1',title:'Llevar memoria USB al laboratorio',date:plusDays(1),time:'07:30',category:'Académico',notes:'Contiene el respaldo del proyecto.',enabled:true,notifiedKey:null},
      {id:'rem_2',title:'Revisar material del parcial',date:plusDays(2),time:'18:00',category:'Evaluación',notes:'Repasar normalización y procedimientos.',enabled:true,notifiedKey:null}
    ]
  };
}

function migrateLegacy(){
  const base=defaultState();
  try{
    const p=JSON.parse(localStorage.getItem(LEGACY.profile)||'null');
    if(p&&typeof p==='object')base.profile={...base.profile,...p};
    const legacyClasses=JSON.parse(localStorage.getItem(LEGACY.schedule)||'null');
    if(Array.isArray(legacyClasses)&&legacyClasses.length){
      const names=[...new Set(legacyClasses.map(c=>c.subject).filter(Boolean))];
      names.forEach((name,i)=>{if(!base.subjects.some(s=>s.name===name))base.subjects.push({id:`legacy_sub_${i}`,name,teacher:'',room:'',color:['blue','green','orange','purple','cyan'][i%5]});});
      base.classes=legacyClasses.map(c=>({id:c.id||uid('class'),subjectId:base.subjects.find(s=>s.name===c.subject)?.id||base.subjects[0].id,day:c.day||'Lun',start:c.start||'08:00',end:c.end||'09:00',place:c.place||''}));
    }
    const legacyTasks=JSON.parse(localStorage.getItem(LEGACY.tasks)||'null');
    if(Array.isArray(legacyTasks)&&legacyTasks.length)base.tasks=legacyTasks.map(t=>({id:t.id||uid('task'),title:t.title||'Tarea',subjectId:base.subjects.find(s=>s.name===t.subject)?.id||base.subjects[0].id,dueDate:t.dueDate||plusDays(1),dueTime:t.dueTime||'23:59',priority:t.priority||'medium',notes:t.notes||'',done:!!t.done,completedAt:t.completedAt||null}));
    const legacyEvals=JSON.parse(localStorage.getItem(LEGACY.evaluations)||'null');
    if(Array.isArray(legacyEvals)&&legacyEvals.length)base.evaluations=legacyEvals.map(v=>({id:v.id||uid('eval'),title:v.title||'Evaluación',subjectId:base.subjects.find(s=>s.name===v.subject)?.id||base.subjects[0].id,date:v.date||plusDays(1),time:v.time||'08:00',type:v.type||'Examen',weight:Number(v.weight)||0,place:v.place||'',completed:!!v.completed,grade:v.grade??null,notes:v.notes||''}));
    const legacyRem=JSON.parse(localStorage.getItem(LEGACY.reminders)||'null');
    if(Array.isArray(legacyRem)&&legacyRem.length)base.reminders=legacyRem.map(r=>({id:r.id||uid('rem'),title:r.title||'Recordatorio',date:r.date||plusDays(1),time:r.time||'08:00',category:r.category||'Académico',notes:r.notes||'',enabled:r.enabled!==false,notifiedKey:null}));
  }catch(_){/* use defaults */}
  return base;
}

function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(parsed&&typeof parsed==='object'){
      const defaults=defaultState();
      return {
        ...defaults,...parsed,
        profile:{...defaults.profile,...(parsed.profile||{})},
        settings:{...defaults.settings,...(parsed.settings||{})},
        subjects:Array.isArray(parsed.subjects)?parsed.subjects:defaults.subjects,
        classes:Array.isArray(parsed.classes)?parsed.classes:defaults.classes,
        tasks:Array.isArray(parsed.tasks)?parsed.tasks:defaults.tasks,
        evaluations:Array.isArray(parsed.evaluations)?parsed.evaluations:defaults.evaluations,
        reminders:Array.isArray(parsed.reminders)?parsed.reminders:defaults.reminders,
        version:APP_VERSION
      };
    }
  }catch(_){/* ignore */}
  return migrateLegacy();
}

let state=loadState();
let currentScreen='welcomeScreen';
let screenHistory=[];
let selectedDay=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][new Date().getDay()]||'Lun';
if(!DAYS.includes(selectedDay))selectedDay='Lun';
let taskFilter='pending',taskSearch='';
let evaluationFilter='upcoming';
let reminderFilter='active';
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let selectedCalendarDate=toISODate(new Date());
let toastTimer=null;
let confirmResolver=null;
let modalReturn='homeScreen';

function saveState(){state.version=APP_VERSION;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function confirmAction(title,message,okLabel='Eliminar'){
  $('confirmTitle').textContent=title;$('confirmMessage').textContent=message;$('confirmOk').textContent=okLabel;$('confirmOverlay').classList.remove('hidden');
  return new Promise(resolve=>{confirmResolver=resolve;});
}
function closeConfirm(value){$('confirmOverlay').classList.add('hidden');if(confirmResolver){confirmResolver(value);confirmResolver=null;}}
$('confirmCancel').addEventListener('click',()=>closeConfirm(false));
$('confirmOk').addEventListener('click',()=>closeConfirm(true));

function navMarkup(active){
  const items=[['homeScreen','⌂','Inicio'],['scheduleScreen','▦','Horario'],['tasksScreen','☷','Tareas'],['remindersScreen','♢','Alertas'],['profileScreen','○','Perfil']];
  return items.map(([id,icon,label])=>`<button data-go="${id}" class="${active===id?'active':''}">${icon}<span>${label}</span></button>`).join('');
}
$$('.bottom-nav').forEach(n=>n.innerHTML=navMarkup(n.dataset.active));

function renderCurrent(){
  if(currentScreen==='homeScreen')renderHome();
  if(currentScreen==='scheduleScreen')renderSchedule();
  if(currentScreen==='tasksScreen')renderTasks();
  if(currentScreen==='calendarScreen')renderCalendar();
  if(currentScreen==='evaluationsScreen')renderEvaluations();
  if(currentScreen==='remindersScreen')renderReminders();
  if(currentScreen==='subjectsScreen')renderSubjects();
  if(currentScreen==='profileScreen')renderProfile();
}
function showScreen(id,{push=true,modal=false}={}){
  const target=$(id);if(!target)return;
  if(modal){modalReturn=currentScreen;}
  else if(push&&currentScreen!==id&&!currentScreen.endsWith('FormScreen')&&currentScreen!=='quickAddScreen'){screenHistory.push(currentScreen);}
  currentScreen=id;
  $$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
  const scroller=target.querySelector('.scrollable');if(scroller)scroller.scrollTop=0;
  renderCurrent();
}
function closeModal(){showScreen(modalReturn,{push:false});}

document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]');if(go){e.preventDefault();showScreen(go.dataset.go);return;}
  const close=e.target.closest('[data-close]');if(close){e.preventDefault();closeModal();}
});

$('enterBtn').addEventListener('click',()=>showScreen('homeScreen'));
$('createBtn').addEventListener('click',()=>openProfileForm('welcomeScreen'));
$('avatarBtn').addEventListener('click',()=>showScreen('profileScreen'));
$('editProfileBtn').addEventListener('click',()=>openProfileForm('profileScreen'));
$('editProfileHeaderBtn').addEventListener('click',()=>openProfileForm('profileScreen'));

function getTaskDue(t){return parseLocal(t.dueDate,t.dueTime||'23:59');}
function getEvalDate(v){return parseLocal(v.date,v.time||'08:00');}
function getReminderDate(r){return parseLocal(r.date,r.time||'08:00');}
function isOverdueTask(t){return !t.done&&getTaskDue(t)<new Date();}

function nextClassOccurrence(c){
  const dayMap={Lun:1,Mar:2,'Mié':3,Jue:4,Vie:5,'Sáb':6};const target=dayMap[c.day];if(target==null)return null;
  const now=new Date();let delta=(target-now.getDay()+7)%7;const [h,m]=c.start.split(':').map(Number);
  if(delta===0&&(h<now.getHours()||(h===now.getHours()&&m<=now.getMinutes())))delta=7;
  const d=new Date(now);d.setDate(now.getDate()+delta);d.setHours(h,m,0,0);return d;
}
function upcomingActivities(limit=8){
  const now=new Date(),items=[];
  state.tasks.filter(t=>!t.done).forEach(t=>{const d=getTaskDue(t);if(d)items.push({date:d,title:t.title,sub:`Tarea · ${subjectName(t.subjectId)}`,kind:'Tarea',color:t.priority==='high'?'red':t.priority==='low'?'green':'orange',screen:'tasksScreen'});});
  state.evaluations.filter(v=>!v.completed).forEach(v=>{const d=getEvalDate(v);if(d&&d>=new Date(now.getTime()-86400000))items.push({date:d,title:v.title,sub:`${v.type} · ${subjectName(v.subjectId)}`,kind:'Evaluación',color:'purple',screen:'evaluationsScreen'});});
  state.reminders.filter(r=>r.enabled).forEach(r=>{const d=getReminderDate(r);if(d&&d>=new Date(now.getTime()-86400000))items.push({date:d,title:r.title,sub:`Alerta · ${r.category}`,kind:'Alerta',color:'blue',screen:'remindersScreen'});});
  state.classes.forEach(c=>{const d=nextClassOccurrence(c);if(d)items.push({date:d,title:subjectName(c.subjectId),sub:`Clase · ${c.place||subjectById(c.subjectId)?.room||'Sin aula'}`,kind:'Clase',color:subjectColor(c.subjectId),screen:'scheduleScreen'});});
  return items.sort((a,b)=>a.date-b.date).slice(0,limit);
}
function weeklyProgress(){
  const now=new Date(),day=now.getDay(),monday=new Date(now);monday.setDate(now.getDate()-(day===0?6:day-1));monday.setHours(0,0,0,0);const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);sunday.setHours(23,59,59,999);
  const weekly=state.tasks.filter(t=>{const d=getTaskDue(t);return d&&d>=monday&&d<=sunday;});
  if(!weekly.length)return{value:0,text:'Sin tareas para esta semana'};
  const done=weekly.filter(t=>t.done).length;const value=Math.round(done/weekly.length*100);return{value,text:`${done} de ${weekly.length} tareas completadas`};
}
function renderHome(){
  const first=(state.profile.name||'Estudiante').trim().split(/\s+/)[0];$('greeting').textContent=`Hola, ${first}`;$('headerDate').textContent=new Intl.DateTimeFormat('es-NI',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  $('avatarBtn').textContent=(first[0]||'E').toUpperCase();
  $('pendingCount').textContent=state.tasks.filter(t=>!t.done).length;
  $('evaluationCount').textContent=state.evaluations.filter(v=>!v.completed&&getEvalDate(v)>=new Date()).length;
  $('alertCount').textContent=state.reminders.filter(r=>r.enabled).length;
  $('subjectCount').textContent=state.subjects.length;
  const wp=weeklyProgress();$('weeklyProgress').textContent=`${wp.value}%`;$('weeklyProgressText').textContent=wp.text;$('progressRingValue').textContent=`${wp.value}%`;$('progressRing').style.setProperty('--p',wp.value);
  const upcoming=upcomingActivities(6);$('upcomingCount').textContent=upcoming.length?`${upcoming.length} actividades`:'';
  $('upcomingList').innerHTML=upcoming.length?upcoming.map(a=>`<button class="timeline-card" data-go="${a.screen}" style="text-align:left;color:inherit"><span class="timeline-dot" style="background:${COLOR_HEX[a.color]||COLOR_HEX.blue}"></span><div><b>${esc(a.title)}</b><small>${esc(a.sub)} · ${esc(relativeDate(toISODate(a.date)))} ${esc(fmtTime(`${pad(a.date.getHours())}:${pad(a.date.getMinutes())}`))}</small></div><span class="tag">${esc(a.kind)}</span></button>`).join(''):'<div class="empty-state" style="padding:25px 10px"><span>🌿</span><b>Agenda despejada</b><small>No tienes actividades próximas.</small></div>';
}
$('quickAddBtn').addEventListener('click',()=>showScreen('quickAddScreen',{modal:true}));
$$('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{const t=btn.dataset.quick;if(t==='task')openTaskForm();if(t==='class')openClassForm();if(t==='evaluation')openEvaluationForm();if(t==='reminder')openReminderForm();if(t==='subject')openSubjectForm();}));

function renderSubjectOptions(){
  const options=state.subjects.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  ['classSubjectSelect','taskSubjectSelect','evaluationSubjectSelect'].forEach(id=>{const el=$(id);const current=el.value;el.innerHTML=options||'<option value="">Primero crea una materia</option>';if([...el.options].some(o=>o.value===current))el.value=current;});
}

// HORARIO
function renderSchedule(){
  $('daysBar').innerHTML=DAYS.map(d=>`<button data-day="${d}" class="${d===selectedDay?'active':''}">${d}</button>`).join('');
  const items=state.classes.filter(c=>c.day===selectedDay).sort((a,b)=>a.start.localeCompare(b.start));
  $('scheduleEmpty').classList.toggle('hidden',items.length>0);
  $('scheduleList').innerHTML=items.map(c=>{const s=subjectById(c.subjectId);return`<article class="schedule-row"><div class="schedule-time">${fmtTime(c.start)}<br>— ${fmtTime(c.end)}</div><div class="class-card" style="--subject-color:${COLOR_HEX[s?.color]||COLOR_HEX.blue}"><b>${esc(s?.name||'Materia')}</b><small>${esc(c.place||s?.room||'Sin aula')} · ${esc(s?.teacher||'Docente no registrado')}</small><div class="item-actions"><button class="edit-btn" data-edit-class="${esc(c.id)}">Editar</button><button class="delete-btn" data-delete-class="${esc(c.id)}">Eliminar</button></div></div></article>`;}).join('');
}
$('daysBar').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){selectedDay=b.dataset.day;renderSchedule();}});
$('addClassBtn').addEventListener('click',()=>openClassForm());
function openClassForm(item=null){
  if(!state.subjects.length){notify('Primero crea una materia');openSubjectForm();return;}
  renderSubjectOptions();const f=$('classForm');f.reset();f.dataset.editId=item?.id||'';$('classFormTitle').textContent=item?'Editar clase':'Nueva clase';
  f.elements.subjectId.value=item?.subjectId||state.subjects[0].id;f.elements.day.value=item?.day||selectedDay;f.elements.start.value=item?.start||'08:00';f.elements.end.value=item?.end||'09:30';f.elements.place.value=item?.place||subjectById(f.elements.subjectId.value)?.room||'';
  showScreen('classFormScreen',{modal:true});
}
$('classForm').addEventListener('submit',e=>{
  e.preventDefault();const f=e.currentTarget,o=Object.fromEntries(new FormData(f).entries());if(o.start>=o.end){notify('La hora final debe ser posterior a la inicial');return;}
  const conflict=state.classes.some(c=>c.id!==f.dataset.editId&&c.day===o.day&&o.start<c.end&&o.end>c.start);if(conflict){notify('Hay un choque con otra clase de ese día');return;}
  if(f.dataset.editId)state.classes=state.classes.map(c=>c.id===f.dataset.editId?{...c,...o}:c);else state.classes.push({id:uid('class'),...o});selectedDay=o.day;saveState();notify(f.dataset.editId?'Clase actualizada':'Clase agregada');showScreen('scheduleScreen',{push:false});
});
$('scheduleList').addEventListener('click',async e=>{
  const edit=e.target.closest('[data-edit-class]'),del=e.target.closest('[data-delete-class]');if(edit){const item=state.classes.find(c=>c.id===edit.dataset.editClass);if(item)openClassForm(item);}
  if(del){const item=state.classes.find(c=>c.id===del.dataset.deleteClass);if(await confirmAction('Eliminar clase',`¿Eliminar ${subjectName(item?.subjectId)} del horario?`)){state.classes=state.classes.filter(c=>c.id!==del.dataset.deleteClass);saveState();renderSchedule();notify('Clase eliminada');}}
});

// TAREAS
$('addTaskBtn').addEventListener('click',()=>openTaskForm());
$('taskSearch').addEventListener('input',e=>{taskSearch=e.target.value.trim().toLowerCase();renderTasks();});
$('taskFilter').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;taskFilter=b.dataset.filter;$$('#taskFilter button').forEach(x=>x.classList.toggle('active',x===b));renderTasks();});
function renderTasks(){
  let items=[...state.tasks];const today=toISODate(new Date());
  if(taskFilter==='pending')items=items.filter(t=>!t.done);if(taskFilter==='today')items=items.filter(t=>!t.done&&t.dueDate===today);if(taskFilter==='done')items=items.filter(t=>t.done);
  if(taskSearch)items=items.filter(t=>(`${t.title} ${subjectName(t.subjectId)} ${t.notes||''}`).toLowerCase().includes(taskSearch));
  items.sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;return getTaskDue(a)-getTaskDue(b);});
  const pending=state.tasks.filter(t=>!t.done),overdue=pending.filter(isOverdueTask),todayCount=pending.filter(t=>t.dueDate===today).length;
  $('taskSummary').innerHTML=`<div class="mini-stat"><b>${pending.length}</b><small>Pendientes</small></div><div class="mini-stat"><b>${todayCount}</b><small>Para hoy</small></div><div class="mini-stat"><b>${overdue.length}</b><small>Vencidas</small></div>`;
  $('taskEmpty').classList.toggle('hidden',items.length>0);
  $('taskList').innerHTML=items.map(t=>{const overdue=isOverdueTask(t);return`<article class="item-card ${t.done?'completed':''}"><div class="item-head"><div><div class="item-title">${esc(t.title)}</div><span class="item-sub">${esc(subjectName(t.subjectId))}</span></div><span class="tag ${t.done?'done':overdue?'overdue':t.priority}">${t.done?'Completada':overdue?'Vencida':t.priority==='high'?'Alta':t.priority==='low'?'Baja':'Media'}</span></div><div class="item-meta"><span class="tag">📅 ${esc(fmtDate(t.dueDate))}</span><span class="tag">🕒 ${esc(fmtTime(t.dueTime||'23:59'))}</span><span class="tag blue">${esc(relativeDate(t.dueDate))}</span></div>${t.notes?`<p class="item-notes">${esc(t.notes)}</p>`:''}<div class="item-actions"><button class="${t.done?'toggle-btn':'done-btn'}" data-toggle-task="${esc(t.id)}">${t.done?'Reabrir':'✓ Completar'}</button><button class="edit-btn" data-edit-task="${esc(t.id)}">Editar</button><button class="delete-btn" data-delete-task="${esc(t.id)}">Eliminar</button></div></article>`;}).join('');
}
function openTaskForm(item=null,presetDate=null){
  if(!state.subjects.length){notify('Primero crea una materia');openSubjectForm();return;}renderSubjectOptions();const f=$('taskForm');f.reset();f.dataset.editId=item?.id||'';$('taskFormTitle').textContent=item?'Editar tarea':'Nueva tarea';f.elements.title.value=item?.title||'';f.elements.subjectId.value=item?.subjectId||state.subjects[0].id;f.elements.dueDate.value=item?.dueDate||presetDate||plusDays(1);f.elements.dueTime.value=item?.dueTime||'23:59';f.elements.priority.value=item?.priority||'medium';f.elements.notes.value=item?.notes||'';showScreen('taskFormScreen',{modal:true});
}
$('taskForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,o=Object.fromEntries(new FormData(f).entries());if(f.dataset.editId)state.tasks=state.tasks.map(t=>t.id===f.dataset.editId?{...t,...o}:t);else state.tasks.push({id:uid('task'),...o,done:false,completedAt:null});saveState();notify(f.dataset.editId?'Tarea actualizada':'Tarea agregada');showScreen('tasksScreen',{push:false});});
$('taskList').addEventListener('click',async e=>{const toggle=e.target.closest('[data-toggle-task]'),edit=e.target.closest('[data-edit-task]'),del=e.target.closest('[data-delete-task]');if(toggle){state.tasks=state.tasks.map(t=>t.id===toggle.dataset.toggleTask?{...t,done:!t.done,completedAt:!t.done?new Date().toISOString():null}:t);saveState();renderTasks();notify('Estado de tarea actualizado');}if(edit){const item=state.tasks.find(t=>t.id===edit.dataset.editTask);if(item)openTaskForm(item);}if(del&&await confirmAction('Eliminar tarea','Esta tarea se eliminará de forma permanente.')){state.tasks=state.tasks.filter(t=>t.id!==del.dataset.deleteTask);saveState();renderTasks();notify('Tarea eliminada');}});

// CALENDARIO
$('prevMonthBtn').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar();});
$('nextMonthBtn').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar();});
$('calendarTodayBtn').addEventListener('click',()=>{const n=new Date();calendarCursor=new Date(n.getFullYear(),n.getMonth(),1);selectedCalendarDate=toISODate(n);renderCalendar();});
$('addForDateBtn').addEventListener('click',()=>openTaskForm(null,selectedCalendarDate));
function dateEvents(date){
  const out=[];state.tasks.filter(t=>t.dueDate===date).forEach(t=>out.push({kind:'Tarea',title:t.title,sub:subjectName(t.subjectId),time:t.dueTime||'23:59',color:t.done?'green':t.priority==='high'?'red':'orange',screen:'tasksScreen'}));state.evaluations.filter(v=>v.date===date).forEach(v=>out.push({kind:'Evaluación',title:v.title,sub:subjectName(v.subjectId),time:v.time||'08:00',color:'purple',screen:'evaluationsScreen'}));state.reminders.filter(r=>r.date===date).forEach(r=>out.push({kind:'Alerta',title:r.title,sub:r.category,time:r.time||'08:00',color:'blue',screen:'remindersScreen'}));return out.sort((a,b)=>a.time.localeCompare(b.time));
}
function renderCalendar(){
  $('calendarTitle').textContent=fmtMonth(calendarCursor);const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();const first=new Date(y,m,1);const offset=(first.getDay()+6)%7;const start=new Date(y,m,1-offset);const today=new Date();let html='';
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=toISODate(d),events=dateEvents(iso),inMonth=d.getMonth()===m;html+=`<button class="calendar-day ${inMonth?'in-month':''} ${isSameDate(d,today)?'today':''} ${iso===selectedCalendarDate?'selected':''}" data-date="${iso}">${d.getDate()}${events.length?`<span class="calendar-dots">${events.slice(0,3).map(()=>'<i></i>').join('')}</span>`:''}</button>`;}
  $('calendarGrid').innerHTML=html;$('selectedDateTitle').textContent=`${fmtDateLong(selectedCalendarDate)}`;const events=dateEvents(selectedCalendarDate);$('calendarDayList').innerHTML=events.length?events.map(a=>`<button class="item-card" data-go="${a.screen}" style="text-align:left;color:inherit"><div class="item-head"><div><div class="item-title">${esc(a.title)}</div><span class="item-sub">${esc(a.kind)} · ${esc(a.sub)}</span></div><span class="tag">${esc(fmtTime(a.time))}</span></div></button>`).join(''):'<div class="empty-state" style="padding:25px 10px"><span>🗓️</span><b>Sin actividades</b><small>No hay registros para esta fecha.</small></div>';
}
$('calendarGrid').addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(!b)return;selectedCalendarDate=b.dataset.date;const d=parseLocal(selectedCalendarDate);if(d&&d.getMonth()!==calendarCursor.getMonth())calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);renderCalendar();});

// EVALUACIONES
$('addEvaluationBtn').addEventListener('click',()=>openEvaluationForm());
$('evaluationFilter').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;evaluationFilter=b.dataset.filter;$$('#evaluationFilter button').forEach(x=>x.classList.toggle('active',x===b));renderEvaluations();});
function weightedGrade(evals){const graded=evals.filter(v=>v.completed&&v.grade!==null&&v.grade!==''&&!Number.isNaN(Number(v.grade)));if(!graded.length)return null;const totalW=graded.reduce((s,v)=>s+(Number(v.weight)||0),0);if(totalW>0)return graded.reduce((s,v)=>s+Number(v.grade)*(Number(v.weight)||0),0)/totalW;return graded.reduce((s,v)=>s+Number(v.grade),0)/graded.length;}
function renderEvaluations(){
  let items=[...state.evaluations];if(evaluationFilter==='upcoming')items=items.filter(v=>!v.completed);if(evaluationFilter==='completed')items=items.filter(v=>v.completed);items.sort((a,b)=>{if(a.completed!==b.completed)return a.completed?1:-1;return getEvalDate(a)-getEvalDate(b);});
  const overall=weightedGrade(state.evaluations);$('overallGrade').textContent=overall===null?'—':overall.toFixed(1);$('completedEvaluations').textContent=`${state.evaluations.filter(v=>v.completed).length}/${state.evaluations.length}`;$('evaluationEmpty').classList.toggle('hidden',items.length>0);
  $('evaluationList').innerHTML=items.map(v=>{const past=getEvalDate(v)<new Date()&&!v.completed;return`<article class="item-card ${v.completed?'completed':''}"><div class="item-head"><div><div class="item-title">${esc(v.title)}</div><span class="item-sub">${esc(subjectName(v.subjectId))} · ${esc(v.type)}</span></div><span class="tag ${v.completed?'done':past?'overdue':'purple'}">${v.completed?(v.grade!==null&&v.grade!==''?`Nota ${Number(v.grade).toFixed(1)}`:'Realizada'):past?'Pendiente':'Próxima'}</span></div><div class="item-meta"><span class="tag">📅 ${esc(fmtDate(v.date))}</span><span class="tag">🕒 ${esc(fmtTime(v.time))}</span><span class="tag">Peso ${Number(v.weight)||0}%</span>${v.place?`<span class="tag">📍 ${esc(v.place)}</span>`:''}</div>${v.notes?`<p class="item-notes">${esc(v.notes)}</p>`:''}<div class="item-actions"><button class="grade-btn" data-grade-eval="${esc(v.id)}">${v.completed?'Cambiar nota':'Registrar resultado'}</button><button class="edit-btn" data-edit-eval="${esc(v.id)}">Editar</button><button class="delete-btn" data-delete-eval="${esc(v.id)}">Eliminar</button></div></article>`;}).join('');
  const rows=state.subjects.map(s=>{const val=weightedGrade(state.evaluations.filter(v=>v.subjectId===s.id));if(val===null)return'';return`<div class="grade-row"><div class="grade-row-head"><span>${esc(s.name)}</span><span>${val.toFixed(1)}</span></div><div class="grade-track"><div class="grade-fill" style="width:${clamp(val,0,100)}%;background:${COLOR_HEX[s.color]||COLOR_HEX.blue}"></div></div></div>`;}).filter(Boolean);$('subjectGradeList').innerHTML=rows.length?rows.join(''):'<div class="empty-state" style="padding:20px 10px"><span>📊</span><b>Sin notas registradas</b><small>Marca evaluaciones como realizadas y agrega su calificación.</small></div>';
}
function openEvaluationForm(item=null,presetDate=null){
  if(!state.subjects.length){notify('Primero crea una materia');openSubjectForm();return;}renderSubjectOptions();const f=$('evaluationForm');f.reset();f.dataset.editId=item?.id||'';$('evaluationFormTitle').textContent=item?'Editar evaluación':'Nueva evaluación';f.elements.title.value=item?.title||'';f.elements.subjectId.value=item?.subjectId||state.subjects[0].id;f.elements.date.value=item?.date||presetDate||plusDays(2);f.elements.time.value=item?.time||'08:00';f.elements.type.value=item?.type||'Examen';f.elements.weight.value=item?.weight??20;f.elements.place.value=item?.place||'';f.elements.completed.checked=!!item?.completed;f.elements.grade.value=item?.grade??'';f.elements.notes.value=item?.notes||'';toggleGradeField();showScreen('evaluationFormScreen',{modal:true});
}
function toggleGradeField(){$('gradeField').style.display=$('evalCompletedInput').checked?'block':'none';}
$('evalCompletedInput').addEventListener('change',toggleGradeField);
$('evaluationForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),o=Object.fromEntries(fd.entries());o.completed=f.elements.completed.checked;o.weight=Number(o.weight)||0;o.grade=o.completed&&o.grade!==''?Number(o.grade):null;if(o.grade!==null&&(o.grade<0||o.grade>100)){notify('La nota debe estar entre 0 y 100');return;}if(f.dataset.editId)state.evaluations=state.evaluations.map(v=>v.id===f.dataset.editId?{...v,...o}:v);else state.evaluations.push({id:uid('eval'),...o});saveState();notify(f.dataset.editId?'Evaluación actualizada':'Evaluación agregada');showScreen('evaluationsScreen',{push:false});});
$('evaluationList').addEventListener('click',async e=>{const grade=e.target.closest('[data-grade-eval]'),edit=e.target.closest('[data-edit-eval]'),del=e.target.closest('[data-delete-eval]');if(grade){const item=state.evaluations.find(v=>v.id===grade.dataset.gradeEval);if(item){item.completed=true;openEvaluationForm(item);}}if(edit){const item=state.evaluations.find(v=>v.id===edit.dataset.editEval);if(item)openEvaluationForm(item);}if(del&&await confirmAction('Eliminar evaluación','Se eliminará la evaluación y su calificación asociada.')){state.evaluations=state.evaluations.filter(v=>v.id!==del.dataset.deleteEval);saveState();renderEvaluations();notify('Evaluación eliminada');}});

// RECORDATORIOS
$('addReminderBtn').addEventListener('click',()=>openReminderForm());
$('reminderFilter').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;reminderFilter=b.dataset.filter;$$('#reminderFilter button').forEach(x=>x.classList.toggle('active',x===b));renderReminders();});
function notificationStatus(){if(!('Notification' in window))return'No disponible en este navegador.';if(location.protocol==='file:')return'En archivo local puede estar bloqueada; usa localhost/HTTPS.';if(Notification.permission==='granted')return'Permiso concedido.';if(Notification.permission==='denied')return'Permiso bloqueado en el navegador.';return'Puedes activar avisos del sistema.';}
function renderReminders(){
  const now=new Date();let items=[...state.reminders];if(reminderFilter==='active')items=items.filter(r=>r.enabled&&getReminderDate(r)>=new Date(now.getTime()-86400000));if(reminderFilter==='past')items=items.filter(r=>getReminderDate(r)<now);items.sort((a,b)=>getReminderDate(a)-getReminderDate(b));$('notificationStatus').textContent=notificationStatus();$('enableNotificationsBtn').textContent=('Notification'in window&&Notification.permission==='granted')?'Activadas':'Activar';$('reminderEmpty').classList.toggle('hidden',items.length>0);
  $('reminderList').innerHTML=items.map(r=>{const past=getReminderDate(r)<now;return`<article class="item-card ${!r.enabled?'completed':''}"><div class="item-head"><div><div class="item-title">${esc(r.title)}</div><span class="item-sub">${esc(r.category)}</span></div><span class="tag ${!r.enabled?'done':past?'overdue':'blue'}">${!r.enabled?'Inactiva':past?'Pasada':'Activa'}</span></div><div class="item-meta"><span class="tag">📅 ${esc(fmtDate(r.date))}</span><span class="tag">🕒 ${esc(fmtTime(r.time))}</span><span class="tag blue">${esc(relativeDate(r.date))}</span></div>${r.notes?`<p class="item-notes">${esc(r.notes)}</p>`:''}<div class="item-actions"><button class="toggle-btn ${r.enabled?'on':''}" data-toggle-rem="${esc(r.id)}">${r.enabled?'● Activa':'○ Inactiva'}</button><button class="edit-btn" data-edit-rem="${esc(r.id)}">Editar</button><button class="delete-btn" data-delete-rem="${esc(r.id)}">Eliminar</button></div></article>`;}).join('');
}
$('enableNotificationsBtn').addEventListener('click',async()=>{if(!('Notification'in window)){notify('Este navegador no ofrece notificaciones');return;}try{const p=await Notification.requestPermission();renderReminders();notify(p==='granted'?'Notificaciones activadas':'No se concedió el permiso');}catch(_){notify('No fue posible solicitar el permiso');}});
function openReminderForm(item=null,presetDate=null){const f=$('reminderForm');f.reset();f.dataset.editId=item?.id||'';$('reminderFormTitle').textContent=item?'Editar recordatorio':'Nuevo recordatorio';f.elements.title.value=item?.title||'';f.elements.date.value=item?.date||presetDate||plusDays(1);f.elements.time.value=item?.time||plusMinutesTime(120);f.elements.category.value=item?.category||'Académico';f.elements.notes.value=item?.notes||'';f.elements.enabled.checked=item?.enabled??true;showScreen('reminderFormScreen',{modal:true});}
$('reminderForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,o=Object.fromEntries(new FormData(f).entries());o.enabled=f.elements.enabled.checked;o.notifiedKey=null;if(f.dataset.editId)state.reminders=state.reminders.map(r=>r.id===f.dataset.editId?{...r,...o}:r);else state.reminders.push({id:uid('rem'),...o});saveState();notify(f.dataset.editId?'Recordatorio actualizado':'Recordatorio agregado');showScreen('remindersScreen',{push:false});});
$('reminderList').addEventListener('click',async e=>{const toggle=e.target.closest('[data-toggle-rem]'),edit=e.target.closest('[data-edit-rem]'),del=e.target.closest('[data-delete-rem]');if(toggle){state.reminders=state.reminders.map(r=>r.id===toggle.dataset.toggleRem?{...r,enabled:!r.enabled,notifiedKey:null}:r);saveState();renderReminders();notify('Alerta actualizada');}if(edit){const item=state.reminders.find(r=>r.id===edit.dataset.editRem);if(item)openReminderForm(item);}if(del&&await confirmAction('Eliminar recordatorio','Esta alerta se eliminará de forma permanente.')){state.reminders=state.reminders.filter(r=>r.id!==del.dataset.deleteRem);saveState();renderReminders();notify('Recordatorio eliminado');}});
function checkReminders(){
  const lead=(Number(state.settings.reminderLead)||0)*60000,now=Date.now();let changed=false;
  state.reminders.forEach(r=>{if(!r.enabled)return;const at=getReminderDate(r);if(!at)return;const trigger=at.getTime()-lead,key=`${r.date}_${r.time}_${state.settings.reminderLead}`;if(now>=trigger&&now<=at.getTime()+5*60000&&r.notifiedKey!==key){if('Notification'in window&&Notification.permission==='granted'&&location.protocol!=='file:'){try{new Notification('Gestión Académica',{body:r.title});}catch(_){}}r.notifiedKey=key;changed=true;if(currentScreen!=='welcomeScreen')notify(`🔔 ${r.title}`);}});if(changed)saveState();
}

// MATERIAS
$('addSubjectBtn').addEventListener('click',()=>openSubjectForm());
function subjectMetrics(id){const pending=state.tasks.filter(t=>t.subjectId===id&&!t.done).length;const upcoming=state.evaluations.filter(v=>v.subjectId===id&&!v.completed).length;const grade=weightedGrade(state.evaluations.filter(v=>v.subjectId===id));return{pending,upcoming,grade};}
function renderSubjects(){
  const grades=state.subjects.map(s=>weightedGrade(state.evaluations.filter(v=>v.subjectId===s.id))).filter(v=>v!==null);const avg=grades.length?grades.reduce((a,b)=>a+b,0)/grades.length:null;$('subjectOverview').innerHTML=`<div><b>${state.subjects.length}</b><small>Materias activas</small></div><div><b>${avg===null?'—':avg.toFixed(1)}</b><small>Promedio general</small></div>`;$('subjectEmpty').classList.toggle('hidden',state.subjects.length>0);
  $('subjectList').innerHTML=state.subjects.map(s=>{const m=subjectMetrics(s.id);return`<article class="subject-card" style="--subject-color:${COLOR_HEX[s.color]||COLOR_HEX.blue}"><div class="subject-card-head"><div><h3>${esc(s.name)}</h3><p>${esc(s.teacher||'Docente no registrado')} · ${esc(s.room||'Sin aula habitual')}</p></div><span class="tag" style="color:${COLOR_HEX[s.color]||COLOR_HEX.blue}">${esc(COLOR_LABEL[s.color]||'Color')}</span></div><div class="subject-metrics"><span><b>${m.pending}</b>Tareas</span><span><b>${m.upcoming}</b>Evaluaciones</span><span><b>${m.grade===null?'—':m.grade.toFixed(1)}</b>Promedio</span></div><div class="item-actions"><button class="edit-btn" data-edit-sub="${esc(s.id)}">Editar</button><button class="delete-btn" data-delete-sub="${esc(s.id)}">Eliminar</button></div></article>`;}).join('');
}
function openSubjectForm(item=null){const f=$('subjectForm');f.reset();f.dataset.editId=item?.id||'';$('subjectFormTitle').textContent=item?'Editar materia':'Nueva materia';f.elements.name.value=item?.name||'';f.elements.teacher.value=item?.teacher||'';f.elements.room.value=item?.room||'';f.elements.color.value=item?.color||'blue';showScreen('subjectFormScreen',{modal:true});}
$('subjectForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,o=Object.fromEntries(new FormData(f).entries());if(f.dataset.editId)state.subjects=state.subjects.map(s=>s.id===f.dataset.editId?{...s,...o}:s);else state.subjects.push({id:uid('sub'),...o});saveState();renderSubjectOptions();notify(f.dataset.editId?'Materia actualizada':'Materia agregada');showScreen('subjectsScreen',{push:false});});
$('subjectList').addEventListener('click',async e=>{const edit=e.target.closest('[data-edit-sub]'),del=e.target.closest('[data-delete-sub]');if(edit){const item=state.subjects.find(s=>s.id===edit.dataset.editSub);if(item)openSubjectForm(item);}if(del){const id=del.dataset.deleteSub;const linked=state.classes.some(c=>c.subjectId===id)||state.tasks.some(t=>t.subjectId===id)||state.evaluations.some(v=>v.subjectId===id);if(linked){notify('No puedes eliminar una materia con clases, tareas o evaluaciones asociadas');return;}if(await confirmAction('Eliminar materia','La materia se eliminará del período.')){state.subjects=state.subjects.filter(s=>s.id!==id);saveState();renderSubjects();renderSubjectOptions();notify('Materia eliminada');}}});

// PERFIL Y AJUSTES
function applySettings(){document.body.classList.toggle('dark',!!state.settings.darkMode);$('darkModeToggle').checked=!!state.settings.darkMode;$('reminderLeadSelect').value=String(state.settings.reminderLead??10);}
function renderProfile(){const p=state.profile,name=p.name||'Estudiante';$('profileName').textContent=name;$('profileCareer').textContent=p.career||'Sin carrera registrada';$('profileMeta').textContent=`${p.level||''}${p.shift?' · '+p.shift:''}${p.email?' · '+p.email:''}`;$('profileAvatar').textContent=(name.trim()[0]||'E').toUpperCase();applySettings();}
function openProfileForm(returnScreen='profileScreen'){renderSubjectOptions();const f=$('profileForm');f.reset();Object.entries(state.profile||{}).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});modalReturn=returnScreen;showScreen('profileFormScreen',{push:false});}
$('profileForm').addEventListener('submit',e=>{e.preventDefault();state.profile={...state.profile,...Object.fromEntries(new FormData(e.currentTarget).entries())};saveState();notify('Perfil guardado');showScreen(modalReturn==='welcomeScreen'?'homeScreen':modalReturn,{push:false});});
$('darkModeToggle').addEventListener('change',e=>{state.settings.darkMode=e.target.checked;saveState();applySettings();notify(e.target.checked?'Modo oscuro activado':'Modo claro activado');});
$('reminderLeadSelect').addEventListener('change',e=>{state.settings.reminderLead=Number(e.target.value);state.reminders=state.reminders.map(r=>({...r,notifiedKey:null}));saveState();notify('Anticipación de alertas actualizada');});
$('exportDataBtn').addEventListener('click',()=>{const payload={app:'Gestión Académica',version:APP_VERSION,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`gestion_academica_v3_${toISODate(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Respaldo exportado');});
$('importDataBtn').addEventListener('click',()=>$('importFileInput').click());
$('importFileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text()),incoming=data.state||data;if(!incoming||!Array.isArray(incoming.subjects)||!Array.isArray(incoming.tasks)||!Array.isArray(incoming.classes)||!Array.isArray(incoming.evaluations)||!Array.isArray(incoming.reminders))throw new Error('Formato inválido');state={...defaultState(),...incoming,profile:{...defaultState().profile,...(incoming.profile||{})},settings:{...defaultState().settings,...(incoming.settings||{})},version:APP_VERSION};saveState();applySettings();renderSubjectOptions();renderCurrent();notify('Respaldo importado correctamente');}catch(err){notify('No se pudo importar: archivo no válido');}e.target.value='';});
$('resetDataBtn').addEventListener('click',async()=>{if(await confirmAction('Restablecer aplicación','Se reemplazarán tus cambios por los datos de demostración.','Restablecer')){state=defaultState();saveState();applySettings();renderSubjectOptions();renderProfile();notify('Datos restaurados');}});

function updateClock(){const d=new Date();$('statusTime').textContent=`${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function registerServiceWorker(){if('serviceWorker'in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}}

// Teclado: Escape cierra formularios/modales
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(currentScreen.endsWith('FormScreen')||currentScreen==='quickAddScreen'))closeModal();});

// Inicialización
saveState();applySettings();renderSubjectOptions();renderHome();renderSchedule();renderTasks();renderCalendar();renderEvaluations();renderReminders();renderSubjects();renderProfile();updateClock();checkReminders();registerServiceWorker();
setInterval(updateClock,30000);setInterval(checkReminders,30000);
