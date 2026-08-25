const screens=[...document.querySelectorAll('.screen')];
const toast=document.getElementById('toast');
let selectedDay='Mié';

const defaults=[
  {id:1,day:'Mié',start:'08:00',end:'09:30',subject:'Programación Móvil',place:'Aula 23',color:'blue'},
  {id:2,day:'Mié',start:'10:00',end:'11:30',subject:'Base de Datos II',place:'Lab. 15',color:'green'},
  {id:3,day:'Mié',start:'14:00',end:'15:30',subject:'Ingeniería de Software II',place:'Aula 21',color:'orange'},
  {id:4,day:'Mié',start:'16:00',end:'17:00',subject:'Proyecto Integrador II',place:'Laboratorio',color:'red'}
];

function loadClasses(){
  try{
    const saved=JSON.parse(localStorage.getItem('ga_schedule')||'null');
    return Array.isArray(saved)?saved:[...defaults];
  }catch{return [...defaults]}
}
let classes=loadClasses();
function save(){localStorage.setItem('ga_schedule',JSON.stringify(classes));}

function show(id){
  screens.forEach(s=>s.classList.toggle('active',s.id===id));
  if(id==='scheduleScreen') renderSchedule();
}
function notify(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1700)}
function fmt(t){
  const [h,m]=t.split(':').map(Number); const ap=h>=12?'PM':'AM'; const hh=((h+11)%12)+1; return `${hh}:${String(m).padStart(2,'0')} ${ap}`;
}

function renderSchedule(){
  document.querySelectorAll('#daysBar button').forEach(b=>b.classList.toggle('active',b.dataset.day===selectedDay));
  const list=document.getElementById('scheduleList');
  const empty=document.getElementById('emptyState');
  const items=classes.filter(c=>c.day===selectedDay).sort((a,b)=>a.start.localeCompare(b.start));
  list.innerHTML=''; empty.classList.toggle('hidden',items.length>0);
  items.forEach(c=>{
    const row=document.createElement('div'); row.className='schedule-row';
    const colorMap={blue:'#24558d',green:'#2da56f',orange:'#f39a27',red:'#bf1230'};
    row.innerHTML=`<div class="time">${fmt(c.start)}<br>– ${fmt(c.end)}</div>
      <div class="class-card" style="--cardColor:${colorMap[c.color]||colorMap.blue}">
        <b>${escapeHtml(c.subject)}</b><small>${escapeHtml(c.place)}</small>
        <div class="class-actions"><button class="delete-btn" data-del="${c.id}">Eliminar</button></div>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=Number(btn.dataset.del); classes=classes.filter(c=>c.id!==id); save(); renderSchedule(); notify('Clase eliminada');
  }));
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}

document.getElementById('enterBtn').addEventListener('click',()=>show('homeScreen'));
document.getElementById('createBtn').addEventListener('click',()=>{notify('Registro simulado para este primer prototipo'); setTimeout(()=>show('homeScreen'),650)});
document.getElementById('logoutBtn').addEventListener('click',()=>show('welcomeScreen'));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
document.querySelectorAll('#daysBar button').forEach(b=>b.addEventListener('click',()=>{selectedDay=b.dataset.day;renderSchedule()}));
document.getElementById('addClassBtn').addEventListener('click',()=>{
  const form=document.getElementById('classForm'); form.reset(); form.elements.day.value=selectedDay; form.elements.start.value='08:00'; form.elements.end.value='09:30'; show('captureScreen');
});
document.getElementById('classForm').addEventListener('submit',e=>{
  e.preventDefault(); const f=new FormData(e.currentTarget); const obj=Object.fromEntries(f.entries());
  if(obj.end<=obj.start){notify('La hora final debe ser mayor'); return;}
  classes.push({...obj,id:Date.now()}); save(); selectedDay=obj.day; show('scheduleScreen'); notify('Clase guardada correctamente');
});

save(); renderSchedule();
