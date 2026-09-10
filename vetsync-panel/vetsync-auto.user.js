// ==UserScript==
// @name         VetSync 처치표 자동 열기
// @namespace    https://github.com/chansvet
// @version      1.0.0
// @description  전용 홈 화면 아이콘으로 VetSync를 열면 채혈·주사 패널을 자동으로 표시합니다.
// @match        https://vetsync4.vetu1.com/*
// @run-at       document-start
// @inject-into  auto
// @noframes
// @grant        none
// @updateURL    https://chansvet.github.io/vetsync-panel/vetsync-auto.meta.js
// @downloadURL  https://chansvet.github.io/vetsync-panel/vetsync-auto.user.js
// ==/UserScript==

(() => {
  const TRIGGER = 'vetsync-panel-auto-open';
  if (new URL(location.href).searchParams.get('vetsync-panel') === '1') {
    sessionStorage.setItem(TRIGGER, '1');
  }

  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (sessionStorage.getItem(TRIGGER) !== '1') {
      clearInterval(timer);
      return;
    }
    if (Date.now() - startedAt > 120000) {
      clearInterval(timer);
      return;
    }
    if (!document.body || location.pathname.startsWith('/login') || !localStorage.getItem('auth-storage')) return;

    sessionStorage.removeItem(TRIGGER);
    clearInterval(timer);
    (() => {
    const API = 'https://api-vetsync4.vetu1.com/api/v1';
    const HOSPITAL_ID = '24';
    const DRAW_HOUR = 9;
    const EVENING = [17, 18, 19, 20, 21, 22, 23];
    const NEXT = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const LIVE = ['PLANNED', 'COMPLETED', 'IN_PROGRESS', 'SKIPPED'];
    const LAB = /혈검|혈액검사|도말|가스|전해질|신4|신장\s*4종|간4|간\s*4종|간이혈당|\bCBC\b|\bCRP\b|\bSAA\b|\bfSAA\b|\bSDMA\b|\bTnI\b|\bCPL\b|\bfPL\b|\bFPL\b|\bPCV\b|\bCK\b|\bChem\d*\b|\bgas\b|\blyte\b|\bTBIL\b|\bT\.?bil\b|\bBUN\b|\bCrea\b|\bALT\b|\bALP\b|\bALB\b|\bphos\b|\bTP\s*\/\s*A\w*\b|\bLactate\b/i;
    const NOT_LAB = /혈압|항혈전|고혈압|이뇨|수혈|요배양|요검사|뇨검사|요카|초음파|방사선|조직검사|항감테|내복|아이스팩|음수|배뇨|배변|CRI|스푼|산소|O2\s*supply/i;
    const GLUCOSE_ONLY = /^(간이혈당|혈당|혈당\s*체크)$/;
    const ELECTROLYTE = /전해질|가스|\bgas\b|\blyte\b/i;
    const HANDLING = /팔|앞다리|뒷다리|후지|전지|경정맥|채혈|지혈|각각|나비침|희석|냉장/;
    const KNOWN = /SAM\s*\d|\bSAM\b|설밤|\bfamo\w*|파모|\bmaro\w*|세레니아|cerenia|\bmero\w*|\bmarbo\w*|마보|\benro\w*|\bcefa\w*|\bcepha\w*|cefotaxime|convenia|\bdalte\w*|\bdatle\w*|tramadol|트라마돌|\btra\s*\d|vit\.?\s?k|비타민k|\bmelo\w*|dexa\w*|덱사|ondansetron|\bondan\w*|온단세트론|파노퀠|calcium\s*gluconate|칼슘글루코네이트|칼슘글루콘산|\bfuro\w*|라식스|butor\w*|carprofen|tranexamic|\bTXA\b|amoxi\w*|clinda\w*|\bgent\w*|prednisolone|프레드|solu|atropine|glyco\w*|호의주|타우린|iron\s*dextran|hydroxocobalamin|cobalamin|G-?csf|\bDPO\b|romiplostim|로미플로스팀|프로롱갈|중탄산나트륨|esomeprazol\w*|eosmeprazol\w*|omeprazol\w*|오메프라졸|chlor\w*phenir\w*|클로르페니라민|\bleve\s*\d|levetiracetam|pheno\s*\d|phenobarbital|\bmeto\b/i;
    const ROUTE = /(?:^|[^a-z])(iv|sc|im)(?![a-z])/i;
    const SKIP = /metro\s*\d|metronidazol\w*|\bmetro\b|메트로|후라시닐|인슐린|insulin|슐린|glargine|글라진|란투스|lantus|프로진크|\bPZI\b|vetsulin|humulin|휴물린|novolin|노보믹스|노보래피드|mannitol|만니톨|\bNAC\b|acetylcystein\w*|20%\s*dex|피하수액|\bPPN\b|\bTPN\b/i;
    const PROC = /medetomidine|dexmed|midazolam|미다졸람|local\s*injection|펫소좀|propofol|alfaxa|ketamine|zoletil|xylazine|럼푼|마취|vincristine|vinblastine|doxorubicin|cyclophosphamide|carboplatin|cisplatin|lomustine|chlorambucil|cytarabine|asparaginase|mitoxantrone|toceranib|빈크리스틴|독소루비신|항암/i;
    const NONAME = /^(추가\s*)?(스테로이드약?|이뇨제|식욕촉진제|식촉제?|심장약|추가약|입원약\s*\d*|항혈전제|안정제|진정제|내복약|po제|간보호제|인흡착제|처방약|기타약|안약|영양제|항생제|진통제|소염제|항히스타민제|위장약|변비약|식후약|아침약|저녁약|\d+번약(\s*\+\s*\d+번약)*|퇴원약)(\s*PO)?$/i;
    const ORAL = /\bpo\b|po제|내복|경구|\d\s*[Tt]\b|\btab\b|캡슐|\bcap\b|시럽|스멕타|레나메진|인흡착제|간보호제|안정제|가바|갑상선약|알약|비오플|봉지|\d\s*알\b|\d\s*정\b|아조딜/i;
    const EYE = /양안|우안|좌안|점안|안약|리포직|포비돈|^V\d|^T\d|\bG\d\b/i;
    const NOTINJ = /드레싱|소독|사진|방사선|초음파|혈검|혈액검사|혈당|체중|체온|심박|호흡|혈압|구토|배변|배뇨|식이|산소|음수|물그릇|핫팩|자세|산책|라인|배액|세정|점이액|교체|측정|확인|보정|면회|목욕|미용|밴드|붕대|카테터|수혈|튜브|네뷸|가습|강급|급여|스푼|연고|스프레이|허니|술부|귀\s?세정|cryo|속도|변경|기입|흉방|요배양|검사|\bCRP\b/i;
    const CRI = /\bcri\b|\/\s*hr\b|시간당/i;
    const COND = /필요시|prn|경우\s*x|없을\s*경우|이면|이하시|이상시|시\s*연결|시\s*중단|보류/i;
    const ROUTINE = [17, 21, 1, 9];
    const U0 = '\u0001', U1 = '\u0002';
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const shift = (date, n) => {
    const d = new Date(date + 'T00:00:00+09:00');
    d.setDate(d.getDate() + n);
    return ymd(d);
    };
    const headers = () => {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) throw new Error('로그인이 안 되어 있습니다.');
    return { Authorization: 'Bearer ' + JSON.parse(raw).state.accessToken, 'X-Hospital-Id': HOSPITAL_ID };
    };
    const get = async (path) => {
    const r = await fetch(API + path, { headers: headers() });
    if (r.status === 401) throw new Error('접속이 만료됐습니다. 새로고침하고 다시 눌러주세요.');
    if (!r.ok) throw new Error('서버 응답 ' + r.status);
    return r.json();
    };
    const cache = {};
    const collect = async (date) => {
    if (cache[date]) return cache[date];
    const list = await get('/charts?date=' + date);
    const details = await Promise.all(list.items.map((c) => get('/charts/' + c.chartId)));
    return (cache[date] = { charts: list.items, details });
    };
    const rowsOf = (d) => (d.sections || []).flatMap((s) => s.rows || []);
    const treatRows = (d) => (d.sections || []).filter((s) => s.section === 'TREATMENT').flatMap((s) => s.rows || []);
    const admitted = (chart, detail, date, hour) => {
    if (!chart.discharged) return true;
    if (!detail.dischargedAt) return false;
    return new Date(detail.dischargedAt) > new Date(date + 'T' + pad(hour) + ':00:00+09:00');
    };
    const latestTemp = (detail) => {
    const c = rowsOf(detail)
    .filter((r) => r.measurementRole === 'TEMPERATURE' || r.displayName === '체온')
    .flatMap((r) => r.cells || [])
    .map((x) => ({ h: x.hourSlot, v: (x.resultSlots || []).map((s) => s.value).filter(Boolean).join('/') }))
    .filter((x) => x.v)
    .sort((a, b) => a.h - b.h);
    return c.length ? c[c.length - 1] : null;
    };
    const noteOf = (row) => {
    if (row.instructionText) return row.instructionText.trim();
    const parts = row.displayName.split(/[,()[\]{}]/).map((s) => s.trim()).filter(Boolean);
    const hits = parts.filter((p) => HANDLING.test(p));
    return hits.length ? hits.join(', ') : '';
    };
    async function bloodwork(date) {
    const { charts, details } = await collect(date);
    const rows = [];
    let needPrev = false;
    charts.forEach((chart, i) => {
    const detail = details[i];
    if (!admitted(chart, detail, date, DRAW_HOUR)) return;
    const labs = rowsOf(detail).filter((r) => {
    const n = (r.displayName || '').trim();
    if (!LAB.test(n) || NOT_LAB.test(n) || GLUCOSE_ONLY.test(n)) return false;
    return (r.cells || []).some((c) => c.hourSlot === DRAW_HOUR && LIVE.includes(c.status));
    });
    if (!labs.length) return;
    const hasE = labs.some((r) => ELECTROLYTE.test(r.displayName));
    const temp = hasE ? latestTemp(detail) : null;
    if (hasE && !temp) needPrev = true;
    const species = { DOG: '강아지', CAT: '고양이' }[chart.patient.species] || chart.patient.species;
    rows.push({
    title: chart.patient.name + ' (#' + chart.patient.hospitalPatientCode + ')',
    cage: species + ' · ' + (chart.cageLabel || '미지정'),
    body: [labs.map((r) => r.displayName.trim()).join(' / ')],
    note: [labs.map(noteOf).filter(Boolean).join(' / '), temp ? '체온 ' + temp.v : ''].filter(Boolean).join(' / '),
    pid: chart.patient.patientId,
    needTemp: hasE && !temp,
    });
    });
    if (needPrev) {
    const prev = await collect(shift(date, -1));
    rows.forEach((row) => {
    if (!row.needTemp) return;
    const i = prev.charts.findIndex((c) => c.patient.patientId === row.pid);
    if (i < 0) return;
    const t = latestTemp(prev.details[i]);
    if (t) row.note = [row.note, '체온 ' + t.v + ' (전날)'].filter(Boolean).join(' / ');
    });
    }
    return [{ heading: date + ' 오전 9시 채혈', groups: rows }];
    }
    const isInjection = (name) => {
    const n = (name || '').trim();
    if (!n || NONAME.test(n)) return false;
    if (SKIP.test(n) || PROC.test(n) || CRI.test(n) || EYE.test(n) || NOTINJ.test(n) || ORAL.test(n)) return false;
    return ROUTE.test(n) || KNOWN.test(n);
    };
    function parseDrug(name) {
    let s = (name || '').trim();
    const notes = [];
    s = s.replace(/(\d+(?:\.\d+)?\s*\S*)\s*(?:->|→)\s*(\d)/g, '$2').replace(/\(\s*(\d+(?:\.\d+)?)\s*\)/g, ' $1 ');
    const pull = (re) => {
    const m = s.match(re);
    if (m) { notes.push(m[0].replace(/[()]/g, '').trim()); s = s.replace(re, ' '); }
    };
    pull(/\(([^)]*)\)/); pull(/\bfor\s+\d+\s*m(?:in)?\b/i); pull(/\d+\s*분(?:동안)?/);
    pull(/\bbolus\b/i); pull(/\bslow(?:ly)?\b/i); pull(/\bsid\b|\bbid\b|\btid\b|\bqid\b|\bq\d+h\b/i);
    let route = '';
    const r = s.match(ROUTE);
    if (r) { route = r[1].toUpperCase(); s = s.replace(ROUTE, ' '); }
    let dose = '';
    const d = s.match(/(\d+(?:\.\d+)?)\s*(mpk|gpk|mg\s*\/\s*kg|mg\s*\/\s*dog|mg\s*\/\s*cat|ml\s*\/\s*kg|ug\s*\/\s*kg|mcg\s*\/\s*kg|ug\s*\/\s*cat|IU\s*\/\s*kg|U\s*\/\s*kg|units?|칸|ml|mg|cc|amp)\b/i);
    if (d) { dose = d[0].replace(/\s+/g, ''); s = s.replace(d[0], ' '); }
    else {
    const b = s.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/);
    if (b) { dose = b[1]; s = s.replace(b[0], ' '); }
    }
    return { drug: s.replace(/\s+/g, ' ').trim().replace(/[,\-]+$/, ''), dose, route, note: notes.filter(Boolean).join(', ') };
    }
    const splitDrugs = (name) => {
    if (!name.includes(',')) return [name];
    const parts = name.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
    return parts.length > 1 && parts.every((p) => ROUTE.test(p) || KNOWN.test(p)) ? parts : [name];
    };
    function pickInj(chart, detail, date, hours, tag) {
    const out = [];
    treatRows(detail).forEach((row) => {
    const name = (row.displayName || '').trim();
    if (!isInjection(name)) return;
    const parts = splitDrugs(name);
    (row.cells || []).forEach((cell) => {
    if (!hours.includes(cell.hourSlot) || !LIVE.includes(cell.status)) return;
    if (!admitted(chart, detail, date, cell.hourSlot)) return;
    parts.forEach((p, i) => out.push({
    patient: chart.patient.name, code: chart.patient.hospitalPatientCode,
    cage: chart.cageLabel || '미지정', tag, hour: cell.hourSlot,
    order: (tag === '내일' ? 100 : 0) + cell.hourSlot,
    key: name + '#' + i, raw: name, instruction: row.instructionText || '', ...parseDrug(p),
    }));
    });
    });
    return out;
    }
    function groupInj(rows) {
    const cages = {}, buckets = {}, unextended = {};
    rows.forEach((r) => {
    const id = r.patient + '|' + r.code;
    if (r.cage !== '미지정' || !cages[id]) cages[id] = r.cage;
    if (r.predicted) unextended[id] = true;
    buckets[id] = buckets[id] || {};
    (buckets[id][r.key] = buckets[id][r.key] || { info: r, hits: [] }).hits.push(r);
    });
    const normal = [], cond = [];
    Object.keys(buckets).forEach((id) => {
    const name = id.split('|')[0] + (unextended[id] ? '(미연장)' : '');
    const lines = [], conds = [];
    Object.values(buckets[id]).forEach((g) => {
    const hours = g.hits.sort((a, b) => a.order - b.order).map((h) => {
    const label = (h.tag === '내일' ? '내일 ' : '') + h.hour + '시';
    return ROUTINE.includes(h.hour) ? label : U0 + label + U1;
    });
    const label = [g.info.drug, g.info.dose, g.info.route].filter(Boolean).join(' ');
    const extra = [g.info.note, g.info.instruction].filter(Boolean).join(', ');
    const text = label + ' (' + hours.join(', ') + ')' + (extra ? ' [' + extra + ']' : '');
    if (COND.test(g.info.raw + ' ' + g.info.instruction)) conds.push(name + ' · ' + text);
    else lines.push(text);
    });
    if (lines.length) normal.push({ title: name, cage: cages[id], body: lines, note: '' });
    cond.push(...conds);
    });
    return { normal, cond };
    }
    async function injections(date) {
    const next = shift(date, 1);
    const today = await collect(date);
    const tomorrow = await collect(next);
    const rows = [];
    today.charts.forEach((c, i) => rows.push(...pickInj(c, today.details[i], date, EVENING, '오늘')));
    const extended = new Set(tomorrow.charts.map((c) => c.patient.patientId));
    tomorrow.charts.forEach((c, i) => rows.push(...pickInj(c, tomorrow.details[i], next, NEXT, '내일')));
    today.charts.forEach((c, i) => {
    if (extended.has(c.patient.patientId) || c.discharged) return;
    pickInj(c, today.details[i], date, NEXT, '내일').forEach((r) => rows.push({ ...r, predicted: true }));
    });
    const g = groupInj(rows);
    const out = [{ heading: date + ' 17시 ~ ' + next + ' 15시 주사', groups: g.normal }];
    if (g.cond.length) out.push({ heading: '조건부', groups: g.cond.map((c) => ({ title: '', cage: '', body: [c], note: '' })) });
    return out;
    }
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const asText = (sections) => sections.map((s) =>
    s.heading + '\n' + s.groups.map((g) =>
    (g.title ? g.title + ' ' + g.cage + '\n  ' : '  ') + g.body.join('\n  ') + (g.note ? '\n  ' + g.note : '')
    ).join('\n')
    ).join('\n\n').split(U0).join('_').split(U1).join('_');
    const render = (sections) => sections.map((s) =>
    '<h2 style="font-size:14px;margin:18px 0 8px;color:' + (s.warn ? '#b45309' : '#6b7280') + '">' + esc(s.heading) + '</h2>' +
    (s.groups.length ? s.groups.map((g) =>
    '<div style="padding:11px 0;border-bottom:1px solid #e5e7eb">' +
    (g.title ? '<div style="font-weight:700;font-size:16px">' + esc(g.title) +
    ' <span style="font-weight:400;color:#6b7280">' + esc(g.cage) + '</span></div>' : '') +
    g.body.map((b) => '<div style="margin-top:3px">' + esc(b).split(U0).join('<u>').split(U1).join('</u>') + '</div>').join('') +
    (g.note ? '<div style="margin-top:3px;color:#b45309;font-weight:600">' + esc(g.note) + '</div>' : '') +
    '</div>').join('') : '<p style="color:#6b7280">해당 항목이 없습니다.</p>')
    ).join('');
    const TABS = [
    { id: 'blood', label: '채혈', run: bloodwork },
    { id: 'inj', label: '주사', run: injections },
    ];
    function open() {
    const old = document.getElementById('vsp');
    if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'vsp';
    box.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;background:#fff;color:#111;' +
    'font:15px/1.5 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;overflow:auto;' +
    '-webkit-overflow-scrolling:touch;padding:0 0 40px');
    box.innerHTML =
    '<div style="position:sticky;top:0;background:#0f766e;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px">' +
    TABS.map((t, i) => '<button data-tab="' + t.id + '" style="font:inherit;font-weight:700;padding:8px 16px;border:0;' +
    'border-radius:8px;background:' + (i === 0 ? '#fff' : 'rgba(255,255,255,.2)') + ';color:' + (i === 0 ? '#0f766e' : '#fff') + '">' + t.label + '</button>').join('') +
    '<span style="flex:1"></span>' +
    '<button id="vsp-copy" style="font:inherit;padding:8px 14px;border:0;border-radius:8px;background:rgba(255,255,255,.2);color:#fff">복사</button>' +
    '<button id="vsp-x" style="font:inherit;padding:8px 14px;border:0;border-radius:8px;background:rgba(255,255,255,.2);color:#fff">닫기</button>' +
    '</div><div id="vsp-body" style="padding:0 16px"><p>불러오는 중…</p></div>';
    document.body.appendChild(box);
    box.querySelector('#vsp-x').onclick = () => box.remove();
    let text = '';
    const show = async (id) => {
    const body = box.querySelector('#vsp-body');
    body.innerHTML = '<p>불러오는 중…</p>';
    box.querySelectorAll('[data-tab]').forEach((b) => {
    const on = b.dataset.tab === id;
    b.style.background = on ? '#fff' : 'rgba(255,255,255,.2)';
    b.style.color = on ? '#0f766e' : '#fff';
    });
    try {
    const sections = await TABS.find((t) => t.id === id).run(ymd(new Date()));
    text = asText(sections);
    body.innerHTML = render(sections);
    } catch (e) {
    text = '';
    body.innerHTML = '<p style="color:#b91c1c">' + esc(e.message) + '</p>';
    }
    };
    box.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => show(b.dataset.tab)));
    box.querySelector('#vsp-copy').onclick = async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = '복사됨'; }
    catch (_) { e.target.textContent = '복사 실패'; }
    };
    show('blood');
    }
    if (!location.hostname.endsWith('vetsync4.vetu1.com')) alert('VetSync 화면에서 눌러주세요.');
    else open();
    })();
  }, 300);
})();
