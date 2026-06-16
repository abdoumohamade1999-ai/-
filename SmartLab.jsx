import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// البيانات الأساسية
// ============================================================================

const SMART_TIPS = [
  "لاعب واحد أمامك؟ هاجمه.", "لاعبان أمامك؟ مرر وتحرك.",
  "قريب من المرمى؟ سدد بسرعة.", "تعبت؟ العب أبسط."
];

const EVENING_SESSIONS = [
  { id:1, title:"الرؤية واتخاذ القرار", subtitle:"شوف قبل ما تستقبل", color:"#E53935", icon:"👁",
    develops:["الرؤية","تقليل فقدان الكرة","اتخاذ القرار"],
    warmup:{ title:"قبل اللعب", items:[{icon:"⚽", text:"20–30 تسديدة للإحماء"}] },
    focus:{ title:"هدفك أثناء اللعب", text:"قبل كل استلام: انظر يمين ← ثم يسار\nحتى لو ما احتجت لذلك." },
    rules:[
      {type:"banned", text:"ممنوع المراوغة إذا كان أمامك لاعبان"},
      {type:"if", condition:"لاعبان أمامك", action:"مرر فوراً ➡️"},
    ]
  },
  { id:2, title:"المراوغة الحقيقية", subtitle:"هاجم ولا تتردد", color:"#7B1FA2", icon:"🌀",
    develops:["الثقة","الجرأة","المراوغة في المباراة"],
    warmup:{ title:"قبل اللعب", items:[{icon:"🏃", text:"30 دقيقة مراوغة + تسديد"}] },
    focus:{ title:"هدفك أثناء اللعب", text:"كل مواجهة 1 ضد 1:\nهاجم مباشرة — لا تتوقف ولا تنتظر." },
    rules:[
      {type:"banned", text:"لا تتوقف أمام المدافع"},
      {type:"allowed", text:"أول لمسة للأمام دائماً"},
    ]
  },
];

const DAYS = [
  {
    id:0, short:"أحد", full:"الأحد", emoji:"🏋️",
    type:"قوة + سرعة", color:"#2979FF", gradient:"linear-gradient(135deg,#1a3a8f,#2979FF)", badge:"صالة",
    sessions:[{
      time:"صباحاً ☀️", duration:"60 دقيقة",
      exercises:[
        {num:1,icon:"🔥",name:"الإحماء",sets:"10 دقائق"},
        {num:2,icon:"⚡",name:"تسارع 10 متر",sets:"4 تكرارات"},
      ]
    }]
  },
  {
    id:1, short:"اثنين", full:"الاثنين", emoji:"🌿",
    type:"تعافٍ نشط", color:"#00C853", gradient:"linear-gradient(135deg,#1b5e20,#00C853)", badge:"راحة",
    sessions:[{
      time:"أي وقت 🌿", duration:"30 دقيقة",
      exercises:[
        {num:1,icon:"⚽",name:"تنطيط الكرة",sets:"30 دقيقة"},
      ]
    }]
  },
  {
    id:6, short:"سبت", full:"السبت", emoji:"😴",
    type:"راحة تامة", color:"#546E7A", gradient:"linear-gradient(135deg,#263238,#546E7A)", badge:"راحة", rest:true, sessions:[]
  }
];

const TTYPES={
  strength:{lbl:'قوة',ic:'💪'},
  endurance:{lbl:'تحمّل',ic:'🫁'},
  speed:{lbl:'سرعة',ic:'⚡'},
  skill:{lbl:'مهارة',ic:'⚽'},
  match:{lbl:'مباراة',ic:'🏟️'}
};

const YEST=[
  ['endur_hard','🔴 تدريب تحمّل قاسٍ البارحة'],
  ['endur_mid','🟠 تدريب تحمّل متوسط البارحة'],
  ['str_hard','🔴 تدريب قوة قاسٍ البارحة'],
  ['str_mid','🟠 تدريب قوة متوسط البارحة'],
  ['rest','💤 لم أتدرّب البارحة']
];

const RANK={str_hard:6,endur_hard:6,str_mid:4,endur_mid:4,rest:0};

// ============================================================================
// دوال مساعدة
// ============================================================================

const ls = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

function isoLocal(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+dd;
}

function todayISO(){return isoLocal(new Date());}
function daysAgoISO(n){const d=new Date();d.setDate(d.getDate()-n);return isoLocal(d);}
function disp(){return new Date().toLocaleDateString('ar-EG');}
function avg(arr){return arr.reduce((a,b)=>a+b,0)/(arr.length||1);}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

// ============================================================================
// مكونات UI
// ============================================================================

const Chev = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function TimerBtn({ seconds, sets }) {
  const [left, setLeft] = useState(seconds);
  const [run, setRun] = useState(false);
  const [set, setSet] = useState(1);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => {
        setLeft(t => {
          if (t <= 1) {
            if (sets && set < sets) { setSet(s=>s+1); return seconds; }
            clearInterval(ref.current); setRun(false); setDone(true); return 0;
          }
          return t-1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [run, set]);

  const reset = () => { clearInterval(ref.current); setLeft(seconds); setRun(false); setDone(false); setSet(1); };
  const m = Math.floor(left/60), s2 = left%60;

  return (
    <div style={{background:done?"#0d2010":"#0a1510",borderRadius:10,padding:"10px 14px",marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${done?"#22C55E":"#556"}`}}>
      <span style={{fontSize:20,fontWeight:800,color:done?"#22C55E":"#F5A623",minWidth:56}}>
        {done?"✓ انتهى":`${String(m).padStart(2,"0")}:${String(s2).padStart(2,"0")}`}
      </span>
      <div style={{display:"flex",gap:6}}>
        {!done&&<button onClick={()=>setRun(r=>!r)} style={{background:run?"#3a1a1a":"#1a3020",color:run?"#ef5350":"#22C55E",border:`1px solid ${run?"#ef5350":"#22C55E"}`,borderRadius:8,padding:"5px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          {run?"⏸":"▶"}
        </button>}
        <button onClick={reset} style={{background:"transparent",color:"#7EAA87",border:"1px solid #1a3020",borderRadius:8,padding:"5px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>↺</button>
      </div>
    </div>
  );
}

// ============================================================================
// التطبيق الرئيسي
// ============================================================================

export default function SmartLabApp() {
  const [view, setView] = useState("hub"); // hub, daily, week, evening
  const [state, setState] = useState({
    daily: {soreness:0, energy:0, mood:0, stress:0, yesterday:null},
    lastDaily: null,
    lastCheckISO: null,
    dailyLog: [],
    tests: {},
    trainLog: [],
    goals: {},
  });

  const [doneExs, setDoneExs] = useState({});
  const [selDay, setSelDay] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // تحميل البيانات
  useEffect(() => {
    const saved = ls.get("smartlab:state");
    if (saved) setState(saved);
    const dExs = ls.get("smartlab:doneExs");
    if (dExs) setDoneExs(dExs);
    setLoaded(true);
  }, []);

  const saveState = useCallback((newState) => {
    setState(newState);
    ls.set("smartlab:state", newState);
  }, []);

  const saveDoneExs = useCallback((val) => {
    setDoneExs(val);
    ls.set("smartlab:doneExs", val);
  }, []);

  if (!loaded) {
    return <div style={{background:"#0b0f1a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:40}}>⚽</div>;
  }

  return (
    <div style={S.root}>
      {/* HUB - الصفحة الرئيسية */}
      {view === "hub" && (
        <HubView onDaily={() => setView("daily")} onWeek={() => setView("week")} />
      )}

      {/* DAILY - الفحص اليومي */}
      {view === "daily" && (
        <DailyView state={state} setState={saveState} onBack={() => setView("hub")} />
      )}

      {/* WEEK - الجدول الأسبوعي */}
      {view === "week" && (
        <WeekView 
          doneExs={doneExs} 
          saveDoneExs={saveDoneExs}
          onEvening={() => setView("evening")}
          onBack={() => setView("hub")}
        />
      )}

      {/* EVENING - الحصة المسائية */}
      {view === "evening" && (
        <EveningView onBack={() => setView("week")} />
      )}
    </div>
  );
}

// ============================================================================
// HUB VIEW - الصفحة الرئيسية
// ============================================================================

function HubView({ onDaily, onWeek }) {
  return (
    <div style={{...S.root, display:"flex", flexDirection:"column"}}>
      <div style={{background:"linear-gradient(180deg,#0f1923,#0b0f1a)",padding:"50px 16px 24px",textAlign:"center"}}>
        <div style={{fontSize:11,color:"#00C853",fontWeight:700,letterSpacing:2,marginBottom:4}}>★ المختبر الذكي 2.0</div>
        <div style={{fontSize:26,fontWeight:900,color:"#fff"}}>المُختبَر <span style={{color:"#c8ff2e"}}>الذكي</span></div>
        <div style={{fontSize:13,color:"#8b9ab0",marginTop:8,lineHeight:1.6}}>جدول تدريب ذكي + فحص يومي شامل + تحليل متقدم</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 14px"}}>
        <button onClick={onDaily} style={{...S.hubBtn, background:"linear-gradient(135deg,#1a3a8f,#2979FF)"}}>
          <div style={{fontSize:40}}>🌅</div>
          <div style={{fontSize:18,fontWeight:800}}>الفحص اليومي</div>
          <div style={{fontSize:13,color:"#aab",marginTop:6}}>حالتك البدنية والنفسية</div>
        </button>

        <button onClick={onWeek} style={{...S.hubBtn, background:"linear-gradient(135deg,#1b5e20,#00C853)"}}>
          <div style={{fontSize:40}}>📅</div>
          <div style={{fontSize:18,fontWeight:800}}>الجدول الأسبوعي</div>
          <div style={{fontSize:13,color:"#aab",marginTop:6}}>حصص تدريب يومية منظمة</div>
        </button>

        <div style={{background:"#111827",borderRadius:16,padding:16,marginTop:16,border:"1px solid #1a2235"}}>
          <div style={{fontSize:12,color:"#7EAA87",fontWeight:700,marginBottom:8}}>💡 نصيحة اليوم</div>
          <div style={{fontSize:13,color:"#e8edf5",lineHeight:1.7}}>
            الجودة تحت التعب هي ما تميزك عن الآخرين. ركز على الأساسيات عندما تتعب.
          </div>
        </div>
      </div>
      <div style={{height:20}}/>
    </div>
  );
}

// ============================================================================
// DAILY VIEW - الفحص اليومي
// ============================================================================

function DailyView({ state, setState, onBack }) {
  const [daily, setDaily] = useState(state.daily);
  const [bed, setBed] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [rhr, setRhr] = useState("");
  const [jump, setJump] = useState("");

  const handleCheck = () => {
    if (!daily.soreness || !daily.energy || !daily.mood || !daily.stress) {
      alert("قيّم كل المؤشرات");
      return;
    }
    if (!daily.yesterday) {
      alert("اختر ماذا تدرّبت البارحة");
      return;
    }

    setState({
      ...state,
      daily: {soreness:0, energy:0, mood:0, stress:0, yesterday:null},
      lastDaily: {score:75},
      lastCheckISO: todayISO(),
    });
    alert("تم حفظ الفحص");
  };

  return (
    <div style={{...S.root,display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#1a3a8f,#2979FF)",padding:"40px 16px 16px"}}>
        <button onClick={onBack} style={S.backBtn}><Chev/></button>
        <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>الفحص اليومي</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>قيّم حالتك من 1 إلى 5</div>
      </div>

      <div style={{...S.scroll2,padding:"16px 14px"}}>
        <div style={S.card}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#e8edf5"}}>كيف حالك اليوم؟ 🌅</h3>

          {/* النوم */}
          <div style={S.questionItem}>
            <label style={{fontSize:13,fontWeight:700,color:"#e8edf5"}}>النوم</label>
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <input type="time" value={bed} onChange={e=>setBed(e.target.value)} style={S.input} />
              <input type="time" value={wake} onChange={e=>setWake(e.target.value)} style={S.input} />
            </div>
          </div>

          {/* النبض */}
          <div style={S.questionItem}>
            <label style={{fontSize:13,fontWeight:700,color:"#e8edf5"}}>نبضات القلب (30 ثانية صباحاً)</label>
            <input type="number" value={rhr} onChange={e=>setRhr(e.target.value)} placeholder="نبضة" style={S.input} />
          </div>

          {/* المقاييس */}
          {["soreness", "energy", "mood", "stress"].map(key => (
            <div key={key} style={S.questionItem}>
              <label style={{fontSize:13,fontWeight:700,color:"#e8edf5"}}>
                {key === "soreness" && "ألم العضلات"}
                {key === "energy" && "الطاقة"}
                {key === "mood" && "المزاج"}
                {key === "stress" && "التوتر"}
              </label>
              <div style={{display:"flex",gap:5,marginTop:6}}>
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setDaily({...daily,[key]:v})}
                    style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${daily[key]===v?"#c8ff2e":"#334"}`,background:daily[key]===v?"#c8ff2e":"#0a1510",color:daily[key]===v?"#000":"#fff",fontWeight:700,cursor:"pointer"}}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* البارحة */}
          <div style={S.questionItem}>
            <label style={{fontSize:13,fontWeight:700,color:"#e8edf5"}}>ماذا تدرّبت البارحة؟</label>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
              {YEST.map(([k,lbl]) => (
                <button key={k} onClick={() => setDaily({...daily,yesterday:k})}
                  style={{textAlign:"right",padding:"10px 12px",borderRadius:10,border:`1px solid ${daily.yesterday===k?"#c8ff2e":"#334"}`,background:daily.yesterday===k?"rgba(200,255,46,0.1)":"#0a1510",color:daily.yesterday===k?"#c8ff2e":"#aab",cursor:"pointer",fontWeight:700}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCheck} style={{...S.btn,marginTop:14}}>
            حدّد شدّة تدريبي ⚡
          </button>
        </div>
        <div style={{height:30}}/>
      </div>
    </div>
  );
}

// ============================================================================
// WEEK VIEW - الجدول الأسبوعي
// ============================================================================

function WeekView({ doneExs, saveDoneExs, onEvening, onBack }) {
  const [selDay, setSelDay] = useState(null);

  if (selDay !== null) {
    return <DayDetailView day={DAYS[selDay]} doneExs={doneExs} saveDoneExs={saveDoneExs} onEvening={onEvening} onBack={() => setSelDay(null)} />;
  }

  return (
    <div style={{...S.root,display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(180deg,#0f1923,#0b0f1a)",padding:"40px 16px 16px"}}>
        <button onClick={onBack} style={S.backBtn}><Chev/></button>
        <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>الجدول الأسبوعي</div>
      </div>

      <div style={{...S.scroll2,padding:"16px 14px"}}>
        {DAYS.map((day, i) => (
          <button key={i} onClick={() => setSelDay(i)}
            style={{...S.weekCard, borderColor:day.color}}>
            <div style={{...S.weekIcon, background:day.gradient}}>
              <span style={{fontSize:20}}>{day.emoji}</span>
            </div>
            <div style={{flex:1,textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#e8edf5"}}>{day.full}</div>
              <div style={{fontSize:12,color:"#8b9ab0",marginTop:3}}>{day.type}</div>
            </div>
            <span style={{color:day.color,fontSize:16}}>›</span>
          </button>
        ))}
        <div style={{height:30}}/>
      </div>
    </div>
  );
}

// ============================================================================
// DAY DETAIL VIEW
// ============================================================================

function DayDetailView({ day, doneExs, saveDoneExs, onEvening, onBack }) {
  const toggleEx = (key) => {
    const updated = {...doneExs, [key]: !doneExs[key]};
    if(!updated[key]) delete updated[key];
    saveDoneExs(updated);
  };

  return (
    <div style={{...S.root,display:"flex",flexDirection:"column"}}>
      <div style={{background:day.gradient,padding:"40px 16px 16px"}}>
        <button onClick={onBack} style={S.backBtn}><Chev/></button>
        <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>{day.full}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>{day.type}</div>
      </div>

      <div style={{...S.scroll2,padding:"12px 14px"}}>
        {day.rest ? (
          <div style={S.restCard}>
            <div style={{fontSize:40,textAlign:"center"}}>😴</div>
            <div style={{fontSize:18,fontWeight:800,textAlign:"center",color:"#e8edf5",marginTop:8}}>يوم الراحة</div>
            <div style={{fontSize:13,color:"#8b9ab0",lineHeight:1.7,marginTop:8,textAlign:"center"}}>الجسم يبني نفسه أثناء الراحة وليس أثناء التمرين</div>
          </div>
        ) : (
          <>
            {day.sessions.map((ses, si) => (
              <div key={si}>
                <div style={{fontSize:13,fontWeight:700,color:day.color,marginBottom:8}}>{ses.time}</div>
                {ses.exercises.map((ex, ei) => {
                  const k = `d${day.id}-${si}-${ei}`;
                  const done = !!doneExs[k];
                  return (
                    <div key={ei} style={{...S.exCard, borderColor:done?"#00C85355":"#1c2535",background:done?"#0d1a0d":"#111827",marginBottom:8,opacity:done?0.7:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700,color:done?"#00C853":"#e8edf5",textDecoration:done?"line-through":"none"}}>{ex.name}</div>
                          <div style={{fontSize:12,color:"#8b9ab0",marginTop:3}}>{ex.sets}</div>
                        </div>
                        <button onClick={() => toggleEx(k)}
                          style={{background:done?"#00C853":"transparent",color:done?"#fff":"#00C853",border:`1px solid #00C853`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:12}}>
                          {done?"✅":"✓"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            <button onClick={onEvening} style={{...S.btn,marginTop:16,background:day.gradient}}>
              ⚽ الحصة المسائية
            </button>
          </>
        )}
        <div style={{height:30}}/>
      </div>
    </div>
  );
}

// ============================================================================
// EVENING VIEW - الحصة المسائية
// ============================================================================

function EveningView({ onBack }) {
  const [active, setActive] = useState(0);
  const ses = EVENING_SESSIONS[active];

  return (
    <div style={{...S.root,display:"flex",flexDirection:"column"}}>
      <div style={{background:"linear-gradient(135deg,#0d1a20,#0f2a18)",padding:"40px 16px 16px"}}>
        <button onClick={onBack} style={S.backBtn}><Chev/></button>
        <div style={{fontSize:28,fontWeight:900,color:"#fff"}}>🌙 الحصة المسائية</div>
      </div>

      <div style={{...S.scroll2,padding:"16px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {EVENING_SESSIONS.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{background:active===i?s.color:"#122318",borderRadius:12,padding:"12px",cursor:"pointer",border:`2px solid ${active===i?s.color:"#1E3A22"}`}}>
              <div style={{fontSize:22}}>{s.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:active===i?"#fff":"#7EAA87",marginTop:4}}>حصة {s.id}</div>
            </button>
          ))}
        </div>

        <div style={{background:`linear-gradient(135deg,${ses.color}22,${ses.color}08)`,borderRadius:14,padding:14,marginBottom:14,border:`1px solid ${ses.color}44`}}>
          <div style={{fontSize:16,fontWeight:900,color:"#e8edf5"}}>{ses.title}</div>
          <div style={{fontSize:12,color:"#7EAA87",marginTop:3}}>{ses.subtitle}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
            {ses.develops.map(d => (
              <span key={d} style={{background:"#0D1F0F",borderRadius:12,padding:"3px 9px",fontSize:10,color:ses.color,fontWeight:700}}>{d}</span>
            ))}
          </div>
        </div>

        <div style={{background:"#0D1F0F",borderRadius:10,padding:12,border:"1px solid #1E3A22"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#7EAA87",marginBottom:8}}>⚡ {ses.warmup.title}</div>
          {ses.warmup.items.map((item, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:18}}>{item.icon}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#e8edf5"}}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{background:"#0D1A0F",borderRadius:10,padding:12,border:"1px solid #1A3020",marginTop:12}}>
          <div style={{fontSize:12,fontWeight:700,color:"#7EAA87",marginBottom:8}}>📋 قانون الحصة</div>
          {ses.rules.map((rule, i) => (
            <div key={i} style={{fontSize:12,color:"#e8edf5",marginBottom:8}}>
              {rule.type === "banned" && <span>❌ {rule.text}</span>}
              {rule.type === "if" && <span>→ إذا كان: {rule.condition} → {rule.action}</span>}
              {rule.type === "allowed" && <span>✅ {rule.text}</span>}
            </div>
          ))}
        </div>

        <div style={{height:30}}/>
      </div>
    </div>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const S = {
  root: {
    background:"#0b0f1a",
    minHeight:"100vh",
    maxWidth:430,
    margin:"0 auto",
    fontFamily:"system-ui,Arial,sans-serif",
    direction:"rtl",
    overflow:"hidden"
  },
  scroll2: {
    flex:1,
    overflowY:"auto"
  },
  backBtn: {
    position:"absolute",
    top:16,
    right:14,
    background:"rgba(255,255,255,0.15)",
    border:"none",
    borderRadius:10,
    width:36,
    height:36,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    cursor:"pointer",
    color:"#fff"
  },
  hubBtn: {
    width:"100%",
    borderRadius:18,
    padding:20,
    border:"none",
    cursor:"pointer",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    gap:8,
    marginBottom:12,
    color:"#fff",
    fontSize:14
  },
  weekCard: {
    display:"flex",
    alignItems:"center",
    gap:12,
    background:"#111827",
    borderRadius:14,
    padding:"12px 14px",
    marginBottom:10,
    border:"2px solid",
    cursor:"pointer",
    width:"100%"
  },
  weekIcon: {
    width:45,
    height:45,
    borderRadius:12,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    flexShrink:0
  },
  card: {
    background:"#111827",
    borderRadius:14,
    padding:14,
    border:"1px solid #1a2235"
  },
  questionItem: {
    marginBottom:14,
    paddingBottom:12,
    borderBottom:"1px solid #1a2235"
  },
  input: {
    background:"#0a1510",
    border:"1px solid #334",
    color:"#fff",
    borderRadius:8,
    padding:"8px 12px",
    fontSize:13,
    fontFamily:"inherit",
    flex:1
  },
  btn: {
    width:"100%",
    background:"#c8ff2e",
    color:"#0a0b0c",
    border:"none",
    borderRadius:12,
    padding:12,
    fontWeight:700,
    cursor:"pointer",
    fontFamily:"inherit",
    fontSize:14
  },
  exCard: {
    background:"#111827",
    borderRadius:12,
    padding:12,
    border:"1.5px solid #1c2535",
    cursor:"pointer"
  },
  restCard: {
    background:"#111827",
    borderRadius:14,
    padding:16,
    textAlign:"center",
    border:"1px solid #1a2235"
  }
};
