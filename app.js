const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let user=null, authMode="login", selectedRange=7, charts={};

const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>new Intl.DateTimeFormat("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).format(new Date(d+"T12:00:00"));
const showToast=(m)=>{const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function boot(){
  const {data:{session}}=await db.auth.getSession();
  if(session){user=session.user; showApp();} else showAuth();
  db.auth.onAuthStateChange((_e,s)=>{user=s?.user||null; user?showApp():showAuth();});
}
function showAuth(){$("authScreen").classList.remove("hidden");$("app").classList.add("hidden")}
async function showApp(){
  $("authScreen").classList.add("hidden");$("app").classList.remove("hidden");
  $("todayTitle").textContent=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  $("greeting").textContent=`Bonjour ${user.email?.split("@")[0]||""} 👋`;
  $("entryDate").value=today();
  await refreshDashboard(); await loadDay(); await loadHistory();
}
function switchSection(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(`${name}Section`).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===name));
  if(name==="dashboard") refreshDashboard();
  if(name==="entry") loadDay();
  if(name==="history") loadHistory();
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>switchSection(b.dataset.section));
$("quickAdd").onclick=()=>switchSection("entry");
$("logoutBtn").onclick=()=>db.auth.signOut();
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("fit-dark",document.body.classList.contains("dark"))};
if(localStorage.getItem("fit-dark")==="true")document.body.classList.add("dark");

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");
  authMode=t.dataset.auth;$("authSubmit").textContent=authMode==="login"?"Se connecter":"Créer mon compte";
});
$("authForm").onsubmit=async e=>{
  e.preventDefault();$("authMessage").textContent="Chargement…";
  const email=$("email").value.trim(), password=$("password").value;
  let r=authMode==="login"?await db.auth.signInWithPassword({email,password}):await db.auth.signUp({email,password});
  if(r.error){$("authMessage").textContent=r.error.message;return}
  $("authMessage").textContent=authMode==="signup"?"Compte créé. Vérifie ton email si la confirmation est activée.":"Connexion réussie.";
};

async function fetchMetrics(days=selectedRange){
  const from=new Date();from.setDate(from.getDate()-days+1);
  const {data,error}=await db.from("daily_metrics").select("*").eq("user_id",user.id).gte("date",from.toISOString().slice(0,10)).order("date");
  if(error) throw error;return data||[];
}
async function refreshDashboard(){
  try{
    const data=await fetchMetrics();
    const t=data.find(x=>x.date===today())||data[data.length-1];
    $("weightStat").textContent=t?.weight!=null?`${Number(t.weight).toFixed(1)} kg`:"—";
    $("burnStat").textContent=t?.calories_burned!=null?`${t.calories_burned} kcal`:"—";
    $("stepsStat").textContent=t?.steps!=null?Number(t.steps).toLocaleString("fr-FR"):"—";
    $("sleepStat").textContent=t?.sleep_hours!=null?`${Number(t.sleep_hours).toFixed(1)} h`:"—";
    const weights=data.filter(x=>x.weight!=null); const first=weights[0]?.weight,last=weights.at(-1)?.weight;
    $("weightTrend").textContent=first!=null&&last!=null?`${(last-first)>=0?"+":""}${(last-first).toFixed(1)} kg sur la période`:"Pas encore de tendance";
    $("burnAvg").textContent=avg(data,"calories_burned","kcal / jour");
    $("stepsAvg").textContent=avg(data,"steps","pas / jour");
    $("sleepAvg").textContent=avg(data,"sleep_hours","h / nuit");
    $("statusLine").textContent=data.length?`${data.length} journée${data.length>1?"s":""} enregistrée${data.length>1?"s":""} sur la période`:"Commence à enregistrer ta première journée.";
    drawCharts(data);
  }catch(e){showToast("Erreur de chargement");console.error(e)}
}
function avg(a,k,s){const v=a.filter(x=>x[k]!=null).map(x=>Number(x[k]));return v.length?`${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(k==="sleep_hours"?1:0)} ${s}`:"—"}
function drawCharts(data){
  const labels=data.map(x=>new Date(x.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}));
  const opts=(label)=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:7}},y:{beginAtZero:false,grid:{color:"rgba(120,130,150,.12)"}}},elements:{line:{tension:.35},point:{radius:2,hoverRadius:5}}});
  const make=(id,label,key)=>{charts[id]?.destroy();charts[id]=new Chart($(id),{type:"line",data:{labels,datasets:[{label,data:data.map(x=>x[key]),borderWidth:3,fill:false,spanGaps:true}]},options:opts(label)})};
  make("weightChart","Poids","weight");make("burnChart","Calories","calories_burned");make("stepsChart","Pas","steps");make("sleepChart","Sommeil","sleep_hours");
}
document.querySelectorAll(".range").forEach(b=>b.onclick=()=>{document.querySelectorAll(".range").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedRange=Number(b.dataset.range);refreshDashboard()});

async function loadDay(){
  const d=$("entryDate").value||today(); $("entryHeading").textContent=`Données du ${fmtDate(d)}`;
  const {data}=await db.from("daily_metrics").select("*").eq("user_id",user.id).eq("date",d).maybeSingle();
  $("weight").value=data?.weight??"";$("caloriesIntake").value=data?.calories_intake??"";$("caloriesBurned").value=data?.calories_burned??"";$("steps").value=data?.steps??"";$("sleepHours").value=data?.sleep_hours??"";$("notes").value=data?.notes??"";
  loadActivities(d);
}
$("entryDate").onchange=loadDay;
$("prevDay").onclick=()=>moveDay(-1);$("nextDay").onclick=()=>moveDay(1);
function moveDay(n){const d=new Date(($("entryDate").value||today())+"T12:00:00");d.setDate(d.getDate()+n);$("entryDate").value=d.toISOString().slice(0,10);loadDay()}
$("metricsForm").onsubmit=async e=>{
 e.preventDefault();const payload={user_id:user.id,date:$("entryDate").value,weight:num("weight"),calories_intake:int("caloriesIntake"),calories_burned:int("caloriesBurned"),steps:int("steps"),sleep_hours:num("sleepHours"),notes:$("notes").value.trim()||null};
 const {error}=await db.from("daily_metrics").upsert(payload,{onConflict:"user_id,date"});if(error){showToast(error.message);return}showToast("Journée enregistrée ✓");refreshDashboard();loadHistory();
};
function num(id){const v=$(id).value;return v===""?null:Number(v)}function int(id){const v=$(id).value;return v===""?null:parseInt(v,10)}
$("activityForm").onsubmit=async e=>{
 e.preventDefault();const d=$("entryDate").value;
 const {error}=await db.from("activities").insert({user_id:user.id,date:d,type:$("activityType").value.trim(),duration_minutes:int("activityDuration"),calories_burned:int("activityCalories"),notes:$("activityNotes").value.trim()||null});
 if(error){showToast(error.message);return}$("activityForm").reset();showToast("Activité ajoutée ✓");loadActivities(d);
};
async function loadActivities(d){
 const {data}=await db.from("activities").select("*").eq("user_id",user.id).eq("date",d).order("created_at",{ascending:false});
 $("activityList").innerHTML=(data||[]).map(a=>`<div class="activity-item"><div><strong>${esc(a.type)}</strong><small>${a.duration_minutes?`${a.duration_minutes} min`:""}${a.calories_burned?` · ${a.calories_burned} kcal`:""}</small></div><div>${a.notes?`<small>${esc(a.notes)}</small>`:""}</div></div>`).join("")||`<div class="muted">Aucune activité pour cette journée.</div>`;
}
async function loadHistory(){
 const {data}=await db.from("daily_metrics").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(100);
 $("historyList").innerHTML=(data||[]).map(x=>`<div class="history-item"><div><strong>${fmtDate(x.date)}</strong><small>${x.notes?esc(x.notes):"Journée enregistrée"}</small></div><div class="history-metrics">${x.weight!=null?`<span class="metric-pill">⚖️ ${x.weight} kg</span>`:""}${x.steps!=null?`<span class="metric-pill">👟 ${Number(x.steps).toLocaleString("fr-FR")}</span>`:""}${x.calories_burned!=null?`<span class="metric-pill">🔥 ${x.calories_burned}</span>`:""}${x.sleep_hours!=null?`<span class="metric-pill">😴 ${x.sleep_hours} h</span>`:""}</div></div>`).join("")||`<div class="muted">Ton historique apparaîtra ici.</div>`;
}
boot();
