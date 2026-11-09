// Flicksy badges: the look comes from the approved design (badges.html), the rules live in src/badges.js.
//   FX.badge(id, size)            -> a DOM node (inline SVG) for one badge
//   FX.badgeAttach(nameEl, data)  -> puts the main badge next to a name; tapping it opens the badge sheet
//   FX.badgeSheet(data, startId)  -> opens the sheet. data = { counts, earned: [ids], primary }
(function () {
  "use strict";
  var FX = window.FX;
  if (!FX || !window.I18N) return;
  var el = FX.el;

var lang = 'fa';
const nf=n=>n.toLocaleString(lang=='fa'?'fa-IR':'en-US');
const LEAF=f=>`<path fill="${f}" d="M8 42V38C8 20 20 8 38 8H86C86 28 73 38 54 38H32C18 38 8 42 8 42Z"/>`;
const BUB=f=>`<path fill="${f}" d="M8 90V65C8 54 17 46 28 46H70C81 46 90 54 90 65C90 76 81 84 70 84H34V90C34 93 32 95 29 95H13C10 95 8 93 8 90Z"/>`;
const GL={
 film:c=>`<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>`,
 play:c=>`<path d="M8 5.5v13l11-6.5z" fill="${c}"/>`,
 clock:c=>`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
 list:c=>`<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r=".7" fill="${c}"/><circle cx="4.5" cy="12" r=".7" fill="${c}"/><circle cx="4.5" cy="17" r=".7" fill="${c}"/>`,
 users:c=>`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5c1.800 1 3 2.700 3 5.500"/>`,
 dots:c=>`<circle cx="7" cy="12" r="1.700" fill="${c}"/><circle cx="12" cy="12" r="1.700" fill="${c}"/><circle cx="17" cy="12" r="1.700" fill="${c}"/>`,
 crown:c=>`<path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z" fill="${c}"/>`,
 rocket:c=>`<path d="M12 3c3.500 2.500 5 6 5 10l-2.500 3h-5L7 13c0-4 1.500-7.500 5-10z"/><circle cx="12" cy="10" r="1.800" fill="${c}"/><path d="M9.500 16l-3 4.500 4-1M14.500 16l3 4.500-4-1"/>`,
 flask:c=>`<path d="M9 3h6M10 3v6.500L5 18.500a2 2 0 0 0 1.700 3h10.600a2 2 0 0 0 1.700-3L14 9.500V3"/><path d="M7.500 15h9"/>`,
 check:c=>`<path d="M5 12.500l4.500 4.500L19 7.500" stroke-width="3.400"/>`,
 heart:c=>`<path d="M12 20s-7.500-4.500-7.500-10.500A4.300 4.300 0 0 1 12 7a4.300 4.300 0 0 1 7.500 2.500C19.500 15.500 12 20 12 20z" fill="${c}"/>`,
 ghost:c=>`<path d="M5 21V11a7 7 0 0 1 14 0v10l-2.500-2-2 2-2-2-2 2-2-2z"/><circle cx="9.500" cy="11" r="1.200" fill="${c}"/><circle cx="14.500" cy="11" r="1.200" fill="${c}"/>`,
 planet:c=>`<circle cx="12" cy="12" r="4.800" fill="${c}"/><ellipse cx="12" cy="12" rx="10" ry="3.600" transform="rotate(-25 12 12)"/>`,
 smile:c=>`<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.800 2.500 2.800 4 2.800s3-1 4-2.800"/><circle cx="9" cy="9.500" r=".9" fill="${c}"/><circle cx="15" cy="9.500" r=".9" fill="${c}"/>`,
 mask:c=>`<path d="M5 4.500h14v8a7 7 0 0 1-14 0z"/><path d="M8.500 9.500h1.500M14 9.500h1.500M9 14.500c1.500 1.500 4.500 1.500 6 0"/>`,
 eye:c=>`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="${c}"/>`,
 sparkle:c=>`<path d="M12 3l2.200 6.300 6.300 2.200-6.300 2.200L12 20l-2.200-6.300L3.500 11.500l6.300-2.200z" fill="${c}"/>`,
 globe:c=>`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
 trophy:c=>`<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8.500 21h7"/>`,
 repeat:c=>`<path d="M17 3l3 3-3 3M20 6H8a5 5 0 0 0-5 5M7 21l-3-3 3-3M4 18h12a5 5 0 0 0 5-5"/>`,
 eyeoff:c=>`<path d="M2 12s4-7 10-7c2 0 3.800.6 5.300 1.500M22 12s-4 7-10 7c-2 0-3.800-.6-5.300-1.500"/><path d="M4 4l16 16"/>`,
 zap:c=>`<path d="M13 2.500L5 13.500h6.500l-1 8 8-11H12z" fill="${c}"/>`,
 moon:c=>`<path d="M20 14.500A8 8 0 1 1 9.500 4 6.500 6.500 0 0 0 20 14.500z" fill="${c}"/>`,
 flag:c=>`<path d="M5 21V4M5 4h12l-2.500 4 2.500 4H5"/>`,
 sun:c=>`<circle cx="12" cy="12" r="4.200" fill="${c}"/><path d="M12 2.500V5M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>`,
 star:c=>`<path d="M12 3l2.800 5.800 6.200.9-4.500 4.400 1.100 6.200L12 17.300 6.400 20.300l1.100-6.200L3 9.700l6.200-.9z" fill="${c}"/>`,
 melon:c=>`<path d="M3 10.500a9 9 0 0 0 18 0z" fill="${c}"/><circle cx="9" cy="14.500" r=".9" fill="rgba(0,0,0,.45)" stroke="none"/><circle cx="12" cy="17" r=".9" fill="rgba(0,0,0,.45)" stroke="none"/><circle cx="15" cy="14.500" r=".9" fill="rgba(0,0,0,.45)" stroke="none"/>`,
 pumpkin:c=>`<ellipse cx="12" cy="13.500" rx="8.500" ry="7" fill="${c}"/><path d="M12 6.500c0-1.500.5-2.500 2-3"/><path d="M8.500 12l1.500 2.200 1.500-2.200zM12.500 12l1.500 2.200 1.500-2.200z" fill="rgba(0,0,0,.5)" stroke="none"/>`,
 fmark:c=>`<g transform="translate(2.200 2.200) scale(.196)" stroke="none">${LEAF(c)+BUB(c)}</g>`
};
const seal=(n=12,r=19.5,a=2)=>{let d='';for(let i=0;i<=120;i++){const t=i/120*Math.PI*2,rr=r+a*Math.cos(n*t);d+=(i?'L':'M')+(24+rr*Math.cos(t)).toFixed(2)+' '+(24+rr*Math.sin(t)).toFixed(2)}return d+'Z'};
const FR={
 ticket:{d:'M12 8H36Q42 8 42 14V20A4.500 4.500 0 0 0 42 29V34Q42 40 36 40H12Q6 40 6 34V29A4.500 4.500 0 0 0 6 20V14Q6 8 12 8Z',cy:24,inner:1},
 square:{d:'M17 5H31Q43 5 43 17V31Q43 43 31 43H17Q5 43 5 31V17Q5 5 17 5Z',cy:24,inner:1},
 circle:{d:'M24 4A20 20 0 1 1 24 44A20 20 0 1 1 24 4Z',cy:24,inner:1},
 hex:{d:'M24 6L39.500 15V33L24 42L8.500 33V15Z',cy:24,s:1,inner:1},
 shield:{d:'M24 6L38 10.500V23C38 32 32 38.500 24 42C16 38.500 10 32 10 23V10.500Z',cy:23,s:1,inner:1},
 bubble:{d:'M16 6H32Q43 6 43 17V25Q43 36 32 36H22L12 44V36H16Q5 36 5 25V17Q5 6 16 6Z',cy:21,inner:1},
 stack:{d:'M12 11H36Q42 11 42 17V37Q42 43 36 43H12Q6 43 6 37V17Q6 11 12 11Z',back:'M12 4H36Q42 4 42 10V13H6V10Q6 4 12 4Z',cy:27},
 seal:{d:seal(),cy:24,inner:1},
 flame:{d:'M24 3C25 11 37 15 37 29A13 13 0 0 1 11 29C11 23 14 19 17 16C17 21 19 24 22 24C21 17 20 9 24 3Z',inner2:'M24 24C26 28 31 30 31 35A7 7 0 0 1 17 35C17 31 21 29 24 24Z'}
};
// palettes: [from, to, glyph color]
const PAL={
 b:['#eba873','#8a4720','#2b1408'],s:['#f6f7fc','#8c94ac','#1c2033'],g:['#fff1ac','#dfa01a','#3b2600'],p:['#dcf8ff','#4aa6d8','#06293b'],d:['#d9bcff','#5862ff','#ffffff'],
 founder:['#ffd27a','#ff4fa3','#2a0a1f'],early:['#8ff5ff','#6b4dff','#06143a'],beta:['#9bf5c8','#2f7df6','#04223a'],verified:['#8fb4ff','#5b3bff','#ffffff'],team:['#c084fc','#5b3bff','#ffffff'],supporter:['#ffb3c7','#ff3d6e','#3a0415'],
 f0:['#ffe08a','#ff7a1a'],f1:['#ffc36b','#ff3d1a'],f2:['#ffa56b','#e11d48'],f3:['#c9e8ff','#6366f1'],
 horror:['#ff8f8f','#7f1022','#ffffff'],scifi:['#8ff0ff','#2d5bff','#04183a'],comedy:['#ffec8a','#ff9a1f','#3a2100'],drama:['#e7b5ff','#7a2dd8','#ffffff'],thriller:['#a9c9cf','#2a4a57','#ffffff'],anim:['#ffb8e2','#b04cff','#2a0a3a'],doc:['#aef3c0','#1f8f5f','#032a1a'],romance:['#ffb8cc','#e11d62','#ffffff'],
 yalda:['#ff8a9a','#9d1239','#ffffff'],nowruz:['#fff3a0','#22c58b','#043a24'],oscar:['#fff1ac','#d99a15','#3b2600'],hallo:['#ffc46b','#e8590c','#2a1100']
};
function defs(){
 return '<defs>'+Object.entries(PAL).map(([k,v])=>`<linearGradient id="p-${k}" gradientUnits="userSpaceOnUse" x1="8" y1="4" x2="40" y2="44"><stop offset="0" stop-color="${v[0]}"/><stop offset="1" stop-color="${v[1]}"/></linearGradient>`).join('')+'<linearGradient id="gloss" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="48"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
}
function bd(it,size){
 const f=FR[it.frame],P=PAL[it.pal],fill=`url(#p-${it.pal})`;
 const st=f.s?` stroke="${fill}" stroke-width="4" stroke-linejoin="round"`:'';
 let b='';
 if(f.back)b+=`<path d="${f.back}" fill="${fill}" opacity=".5"/>`;
 b+=`<path d="${f.d}" fill="${fill}"${st}/><path d="${f.d}" fill="url(#gloss)"/>`;
 if(it.frame=='flame')b+=`<path d="${f.inner2}" fill="#fff" fill-opacity=".6"/>`;
 if(f.inner&&(it.pal=='p'||it.pal=='d'))b+=`<path d="${f.d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" transform="translate(24 24) scale(.8) translate(-24 -24)"/>`;
 if(it.glyph)b+=`<g transform="translate(14.400 ${f.cy-9.6}) scale(.8)" fill="none" stroke="${P[2]}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${GL[it.glyph](P[2])}</g>`;
 if(it.ring)b+=`<circle cx="24" cy="24" r="23" fill="none" stroke="${fill}" stroke-width="1.4" stroke-dasharray="2.500 3"/>`;
 if(it.pal=='d')b+=`<path d="M39 3l1.700 4.600L45.300 9.300l-4.600 1.700L39 15.600l-1.700-4.600L32.700 9.300l4.600-1.700z" fill="#fff"/>`;
 return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
}
// items
const U={mv:['فیلم','movies'],ep:['قسمت','episodes'],h:['ساعت','hours'],ls:['لیست','lists'],fo:['دنبال‌کننده','followers'],cm:['نظر','comments'],d:['روز','days']};
const tierPal=(i,n)=>'bsgpd'[Math.round(i*4/(n-1))];
const lad=(id,u,frame,glyph,vals,ringAt,pals)=>vals.map((v,i)=>({id:id+v,frame,glyph,pal:pals?pals[i]:tierPal(i,vals.length),ring:v==ringAt,lab:()=>nf(v)+' '+U[u][lang=='fa'?0:1]}));
const one=(id,frame,glyph,pal,fa,en)=>({id,frame,glyph,pal,lab:()=>lang=='fa'?fa:en});
const CATS=[
 {fa:'بنیان‌گذار و ویژه',en:'Founders & special',items:[
  one('founder','seal','crown','founder','۱۰۰ کاربر اول','First 100'),
  one('early','seal','rocket','early','۱۰۰۰ کاربر اول','First 1,000'),
  one('beta','hex','flask','beta','تست‌کنندهٔ بتا','Beta tester'),
  one('verified','seal','check','verified','تأییدشده','Verified'),
  one('team','hex','fmark','team','تیم Flicksy','Flicksy team'),
  one('supporter','seal','heart','supporter','حامی','Supporter')]},
 {fa:'فیلم دیده‌شده',en:'Movies watched',items:lad('m','mv','ticket','film',[10,50,100,250,500,1000,2500,5000],1000)},
 {fa:'قسمت دیده‌شده',en:'Episodes watched',items:lad('e','ep','square','play',[50,250,1000,2500,5000,10000],1000)},
 {fa:'ساعت تماشا',en:'Hours watched',items:lad('h','h','circle','clock',[100,500,1000,5000],1000)},
 {fa:'لیست‌ها',en:'Lists',items:[...lad('l','ls','stack','list',[1,5,20]),
  one('cur100','stack','heart','p','لیست ۱۰۰ دنبال‌کننده‌ای','100-follower list'),one('cur1000','stack','heart','d','لیست ۱۰۰۰ دنبال‌کننده‌ای','1,000-follower list')]},
 {fa:'اجتماعی',en:'Social',items:[...lad('f','fo','circle','users',[10,100,1000,10000],1000),...lad('c','cm','bubble','dots',[10,100,1000])]},
 {fa:'پیاپی بودن',en:'Streaks',items:lad('s','d','flame',null,[7,30,100,365],365,['f0','f1','f2','f3'])},
 {fa:'استاد ژانر',en:'Genre masters',items:[
  one('horror','shield','ghost','horror','استاد ترسناک','Horror master'),one('scifi','shield','planet','scifi','استاد علمی‌تخیلی','Sci-Fi master'),
  one('comedy','shield','smile','comedy','استاد کمدی','Comedy master'),one('drama','shield','mask','drama','استاد درام','Drama master'),
  one('thriller','shield','eye','thriller','استاد تریلر','Thriller master'),one('anim','shield','sparkle','anim','استاد انیمیشن','Animation master'),
  one('doc','shield','globe','doc','استاد مستند','Documentary master'),one('romance','shield','heart','romance','استاد عاشقانه','Romance master')]},
 {fa:'رتبهٔ جدول',en:'Leaderboard',items:[
  one('lb10','hex','trophy','s','ده نفر اول','Top 10'),one('lb3','hex','trophy','g','سه نفر اول','Top 3'),one('lb1','hex','crown','d','نفر اول','#1')]},
 {fa:'رفتاری',en:'Behavior',items:[
  one('rewatch','circle','repeat','doc','بازبین','Rewatcher'),one('spoiler','circle','eyeoff','thriller','ضدلو','Spoiler-safe'),
  one('marathon','circle','zap','comedy','ماراتن','Marathoner'),one('night','circle','moon','early','شب‌زنده‌دار','Night owl'),
  one('finisher','circle','flag','romance','تمام‌کنندهٔ سریال','Series finisher')]},
 {fa:'مناسبتی',en:'Seasonal',items:[
  one('yalda','seal','melon','yalda','شب یلدا','Yalda night'),one('nowruz','seal','sun','nowruz','نوروز','Nowruz'),
  one('oscar','seal','star','oscar','شب اسکار','Oscar night'),one('hallo','seal','pumpkin','hallo','هالووین','Halloween')]}
];
const ALL={};CATS.forEach(c=>c.items.forEach(i=>ALL[i.id]=i));

  // ---------- app glue ----------
  var TXT = {
    fa: { title: "نشان‌ها", of: "از", back: "بستن", pin: "بذار کنار اسمم", unpin: "برداشتن از کنار اسمم", lock: "قفل", pinned: "نشان کنار اسمت گذاشته شد", auto: "به حالت خودکار برگشت", fail: "ذخیره نشد، دوباره امتحان کن", next: "نشان بعدی", max: "به بالاترین سطح رسیدی", earned: "نشان‌های گرفته‌شده", locked: "در راه", special: "نشان ویژه", empty: "هنوز نشانی نگرفته‌ای.",
      m: "فیلم تماشا شده", e: "قسمت تماشا شده", l: "لیست ساخته‌شده", f: "دنبال‌کننده", c: "نظر نوشته‌شده", h: "ساعت تماشا (تخمینی)", s: "روز پشت‌سرهم (بهترین رکوردت)", cur: "دنبال‌کنندهٔ پرطرفدارترین لیست",
      d_founder: "جزو ۱۰۰ نفر اول Flicksy بودی.", d_early: "جزو ۱۰۰۰ نفر اول Flicksy بودی.", d_beta: "در تست بتا کمک کردی.", d_verified: "این حساب تأییدشده است.", d_team: "عضو تیم Flicksy.", d_supporter: "از Flicksy حمایت کرده‌ای.", d_yalda: "شب یلدا هم Flicksy همراهت بود.", d_nowruz: "نوروز را با فیلم و سریال شروع کردی.", d_hallo: "هالووین را با تماشا گذراندی." },
    en: { title: "Badges", of: "of", back: "Close", pin: "Pin next to my name", unpin: "Remove from my name", lock: "Locked", pinned: "Badge pinned next to your name", auto: "Back to automatic", fail: "Could not save, try again", next: "Next badge", max: "Top level reached", earned: "Earned badges", locked: "Coming up", special: "Special badge", empty: "No badges yet.",
      m: "movies watched", e: "episodes watched", l: "lists created", f: "followers", c: "comments written", h: "hours watched (estimated)", s: "days in a row (your best)", cur: "followers on your top list",
      d_founder: "You were among the first 100 people on Flicksy.", d_early: "You were among the first 1,000 people on Flicksy.", d_beta: "You helped test the beta.", d_verified: "This account is verified.", d_team: "Part of the Flicksy team.", d_supporter: "You supported Flicksy.", d_yalda: "You watched on Yalda night.", d_nowruz: "You watched during Nowruz.", d_hallo: "You watched on Halloween." }
  };
  var LADDERS = { m: [10, 50, 100, 250, 500, 1000, 2500, 5000], e: [50, 250, 1000, 2500, 5000, 10000], l: [1, 5, 20], f: [10, 100, 1000, 10000], c: [10, 100, 1000], h: [100, 500, 1000, 5000], s: [7, 30, 100, 365] };
  var COUNT_OF = { m: "movies", e: "episodes", l: "lists", f: "followers", c: "comments", h: "hours", s: "streak" };
  var UNIT = { m: "mv", e: "ep", l: "ls", f: "fo", c: "cm", h: "h", s: "d" };
  // single badges with a goal: counts[key] (or counts.genres[genre]) has to reach goal; u = unit text [fa, en]
  var THRESH = {
    rewatch: { key: "rewatches", goal: 5, u: ["بار تماشای دوباره", "rewatches"] },
    spoiler: { key: "spoilers", goal: 10, u: ["کامنت اسپویلری", "spoiler comments"] },
    finisher: { key: "finished", goal: 3, u: ["سریال دیده‌شده", "series finished"] },
    marathon: { key: "marathon", goal: 10, u: ["قسمت در یک روز", "episodes in one day"] }
  };
  ["horror", "scifi", "comedy", "drama", "thriller", "anim", "doc", "romance"].forEach(function (g) {
    THRESH[g] = { genre: g, goal: 20, u: ["عنوان از این ژانر", "titles in this genre"] };
  });
  function threshVal(th, counts) {
    return th.genre ? ((counts.genres || {})[th.genre] || 0) : (counts[th.key] || 0);
  }

  function setLang() { lang = I18N.lang === "fa" ? "fa" : "en"; }

  function mountDefs() {
    if (document.getElementById("fx-badge-defs")) return;
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("id", "fx-badge-defs");
    s.setAttribute("width", "0");
    s.setAttribute("height", "0");
    s.setAttribute("aria-hidden", "true");
    s.style.position = "absolute";
    s.innerHTML = defs();
    document.body.appendChild(s);
  }

  function css() {
    if (document.getElementById("fx-badge-css")) return;
    var st = document.createElement("style");
    st.id = "fx-badge-css";
    st.textContent =
      ".bdg { display: inline-flex; vertical-align: middle; margin-inline-start: 8px; padding: 0; line-height: 0; background: none; border: 0; cursor: pointer; }" +
      ".bdg:active { transform: scale(.92); }" +
      ".bdg svg, .bs-top svg { filter: drop-shadow(0 4px 8px rgba(120,90,255,.35)); }" +
      ".bs-top { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; }" +
      ".bs-top h4 { font-size: 22px; font-weight: 800; margin-top: 8px; }" +
      ".bs-top p { color: var(--muted); font-size: 14px; line-height: 1.7; }" +
      ".bs-prog { margin: 16px 0 4px; height: 8px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }" +
      ".bs-prog i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(135deg,#a855f7,#6366f1); }" +
      ".bs-pl { display: flex; justify-content: space-between; color: var(--muted); font-size: 12.5px; font-weight: 600; }" +
      ".bs-nx { color: var(--muted); font-size: 12.5px; margin-top: 6px; }" +
      ".bs-sec { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); font-weight: 700; }" +
      ".bs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px 6px; margin-top: 14px; justify-items: center; }" +
      ".bs-nm { font-size: 11.5px; font-weight: 700; text-align: center; line-height: 1.4; color: #e6e6f8; }" +
      ".bs-nm.dim { color: var(--muted); font-weight: 600; }" +
      ".bs-pin { margin-top: 20px; width: 100%; border: 0; border-radius: 16px; padding: 14px; font-size: 15px; font-weight: 800; color: #fff; background: linear-gradient(135deg,#a855f7,#6366f1); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }" +
      ".bs-pin.off { background: rgba(255,255,255,.1); }" +
      ".bs-pin:disabled { background: rgba(255,255,255,.08); color: var(--muted); cursor: not-allowed; }" +
      ".bs-grid button { background: none; border: 0; padding: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 7px; color: inherit; font: inherit; }" +
      ".bs-grid button svg { display: block; }" +
      ".bs-grid button.sel .bs-ic { outline: 2px solid #a855f7; outline-offset: 3px; border-radius: 14px; }" +
      ".bs-ic { line-height: 0; }" +
      ".bpage { z-index: 30; }" +
      ".bp-in { padding: calc(72px + env(safe-area-inset-top)) 18px 0; }" +
      ".bp-in h1 { font-size: 26px; font-weight: 800; letter-spacing: -.3px; }" +
      ".bp-in .bp-sub { color: var(--muted); font-size: 13px; font-weight: 600; margin-top: 4px; }" +
      ".bpage .bs-grid { margin-top: 22px; }" +
      ".bs-lock { display: inline-block; filter: grayscale(1); opacity: .28; line-height: 0; }" +
      ".bs-top.lk svg { opacity: .55; filter: grayscale(.6); }" +
      ".bs-sec-plain { margin-top: 18px; padding: 0; height: 0; }" +
      ".bdg-mini { display: inline-flex; line-height: 0; margin-inline-start: 6px; vertical-align: middle; flex: none; pointer-events: none; }" +
      ".bdg-mini svg { display: block; }" +
      ".cm-nm .bdg-mini { align-self: center; margin-inline-start: 0; }" +
      ".ac-nm b.has-bdg, .sp-name.has-bdg { display: flex; align-items: center; }" +
      ".has-bdg > .nm-t { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }";
    document.head.appendChild(st);
  }

  function holder(html) {
    var s = el("span");
    s.style.lineHeight = "0";
    s.innerHTML = html;
    return s.firstChild;
  }

  FX.badge = function (id, size) {
    var it = ALL[id];
    if (!it) return null;
    setLang();
    mountDefs();
    return holder(bd(it, size || 28));
  };

  // A small badge for list rows (leaderboard, comments, people search). It is only a picture:
  // tapping the row does what it did before (opens the person's profile, where the full badge page lives).
  FX.badgeMini = function (id, size) {
    var it = ALL[id];
    if (!it) return null;
    setLang();
    mountDefs();
    css();
    var s = el("span", "bdg-mini");
    s.innerHTML = bd(it, size || 20);
    return s;
  };

  // A picture address (SVG data URL) of one badge that carries its own colours, for drawing a badge on a share card.
  FX.badgeImageUrl = function (id) {
    var it = ALL[id];
    if (!it) return null;
    setLang();
    var svg = bd(it, 256).replace(/^<svg[^>]*>/, function (m) { return m + defs(); });
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };

  // how to get each badge (shown when it is not earned yet)
  var ACTIVE = /^(m|e|l|f|c|h|s)\d+$|^(cur100|cur1000|founder|early|team|verified|beta|supporter|rewatch|spoiler|finisher|marathon|yalda|nowruz|hallo|horror|scifi|comedy|drama|thriller|anim|doc|romance)$/;
  var HOW = {
    fa: { m: "{n} فیلم را «دیده‌شده» علامت بزن.", e: "{n} قسمت را «دیده‌شده» علامت بزن.", l: "{n} لیست بساز.", f: "{n} نفر دنبالت کنند.", c: "{n} کامنت بنویس.", h: "{n} ساعت فیلم و سریال تماشا کن.", s: "{n} روز پشت‌سرهم چیزی تماشا کن.",
      cur100: "لیستی عمومی بساز که ۱۰۰ نفر دنبالش کنند.", cur1000: "لیستی عمومی بساز که ۱۰۰۰ نفر دنبالش کنند.",
      founder: "فقط ۱۰۰ نفر اول Flicksy این نشان را دارند.", early: "فقط ۱۰۰۰ نفر اول Flicksy این نشان را دارند.", beta: "تیم Flicksy این نشان را به تست‌کننده‌های بتا می‌دهد.", verified: "حساب‌های تأییدشده را تیم Flicksy مشخص می‌کند.", team: "ویژه‌ی اعضای تیم Flicksy.", supporter: "تیم Flicksy این نشان را به حامیان می‌دهد.",
      genre: "حداقل ۲۰ فیلم و سریال از همین ژانر را «دیده‌شده» علامت بزن.", lb: "در جدول ماهانه‌ی برترها به این رتبه برس.",
      rewatch: "۵ بار «دوباره دیدم» را روی فیلم‌ها ثبت کن.", spoiler: "۱۰ کامنت با برچسب اسپویلر بنویس.", marathon: "در یک روز ۱۰ قسمت تماشا کن (جدا از هم علامت بزن، نه یکجا).", night: "دیروقت شب تماشا کن.", finisher: "۳ سریال را «دیده‌شده» علامت بزن.",
      yalda: "در شب یلدا (۲۰ یا ۲۱ دسامبر) چیزی تماشا کن.", nowruz: "در نوروز (۲۰ تا ۲۳ مارس) چیزی تماشا کن.", oscar: "فقط در شب اسکار قابل دریافت است.", hallo: "در هالووین (۳۱ اکتبر) چیزی تماشا کن.",
      not: "هنوز نگرفته‌ای", soon: "این نشان هنوز فعال نشده و به‌زودی اضافه می‌شود.", left: "{n} {u} دیگه مونده" },
    en: { m: "Mark {n} movies as Watched.", e: "Mark {n} episodes as Watched.", l: "Create {n} lists.", f: "Get {n} followers.", c: "Write {n} comments.", h: "Watch {n} hours of movies and series.", s: "Watch something {n} days in a row.",
      cur100: "Make a public list that 100 people follow.", cur1000: "Make a public list that 1,000 people follow.",
      founder: "Only the first 100 people on Flicksy have this.", early: "Only the first 1,000 people on Flicksy have this.", beta: "The Flicksy team gives this to beta testers.", verified: "The Flicksy team decides which accounts are verified.", team: "For members of the Flicksy team.", supporter: "The Flicksy team gives this to supporters.",
      genre: "Mark at least 20 movies and series of this genre as Watched.", lb: "Reach this rank on the monthly leaderboard.",
      rewatch: "Log 5 rewatches of movies.", spoiler: "Write 10 comments tagged as spoilers.", marathon: "Watch 10 episodes in one day (mark them one by one, not all at once).", night: "Watch late at night.", finisher: "Mark 3 series as Watched.",
      yalda: "Watch something on Yalda night (Dec 20 or 21).", nowruz: "Watch something during Nowruz (Mar 20-23).", oscar: "Only available on Oscar night.", hallo: "Watch something on Halloween (Oct 31).",
      not: "Not earned yet", soon: "This badge isn't active yet and will be added soon.", left: "{n} more {u} to go" }
  };
  var GENRES = { horror: 1, scifi: 1, comedy: 1, drama: 1, thriller: 1, anim: 1, doc: 1, romance: 1 };
  var LB = { lb10: 1, lb3: 1, lb1: 1 };

  function howText(id, m) {
    var h = HOW[lang];
    if (!m) m = /^([hs])(\d+)$/.exec(id);
    if (m) return h[m[1]].replace("{n}", nf(+m[2]));
    if (h[id]) return h[id];
    if (GENRES[id]) return h.genre;
    if (LB[id]) return h.lb;
    return "";
  }

  var LOCKSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function sheetBody(sh, data, id, opts) {
    setLang();
    var t = TXT[lang], h = HOW[lang], counts = data.counts || {}, earned = data.earned || [];
    var it = ALL[id];
    while (sh.childNodes.length > 1) sh.removeChild(sh.lastChild);
    if (!it) { sh.appendChild(el("div", "bs-nx", t.empty)); return; }
    var have = {};
    earned.forEach(function (x) { have[x] = 1; });
    var got = !!have[id];
    var desc = got ? t.special : "", prog = "", status = "";
    var m = /^([melfchs])(\d+)$/.exec(id);
    if (m) {
      var k = m[1], v = +m[2], lv = LADDERS[k], cnt = counts[COUNT_OF[k]] || 0, unit = U[UNIT[k]][lang === "fa" ? 0 : 1];
      if (got) {
        var nx = lv[lv.indexOf(v) + 1];
        desc = nf(cnt) + " " + t[k];
        if (nx) prog = '<div class="bs-prog"><i style="width:' + Math.max(0, Math.min(100, Math.round(100 * (cnt - v) / (nx - v)))) + '%"></i></div><div class="bs-pl"><span>' + nf(v) + "</span><span>" + nf(nx) + '</span></div><div class="bs-nx">' + t.next + ": " + nf(nx) + " " + unit + "</div>";
        else prog = '<div class="bs-nx">' + t.max + "</div>";
      } else {
        desc = howText(id, m);
        status = h.not;
        prog = '<div class="bs-prog"><i style="width:' + Math.max(0, Math.min(100, Math.round(100 * cnt / v))) + '%"></i></div><div class="bs-pl"><span>' + nf(cnt) + "</span><span>" + nf(v) + '</span></div><div class="bs-nx">' + h.left.replace("{n}", nf(Math.max(0, v - cnt))).replace("{u}", unit) + "</div>";
      }
    } else if (id === "cur100" || id === "cur1000") {
      var lf = counts.list_followers || 0, goal = id === "cur100" ? 100 : 1000;
      if (got) {
        desc = nf(lf) + " " + t.cur;
        prog = id === "cur100" ? '<div class="bs-prog"><i style="width:' + Math.max(0, Math.min(100, Math.round(100 * (lf - 100) / 900))) + '%"></i></div><div class="bs-pl"><span>' + nf(100) + "</span><span>" + nf(1000) + '</span></div><div class="bs-nx">' + t.next + ": " + nf(1000) + "</div>" : '<div class="bs-nx">' + t.max + "</div>";
      } else {
        desc = howText(id, null);
        status = h.not;
        prog = '<div class="bs-prog"><i style="width:' + Math.max(0, Math.min(100, Math.round(100 * lf / goal))) + '%"></i></div><div class="bs-pl"><span>' + nf(lf) + "</span><span>" + nf(goal) + '</span></div><div class="bs-nx">' + h.left.replace("{n}", nf(Math.max(0, goal - lf))).replace("{u}", lang === "fa" ? "دنبال‌کننده" : "followers") + "</div>";
      }
    } else if (THRESH[id]) {
      var th = THRESH[id], val = threshVal(th, counts), ul = th.u[lang === "fa" ? 0 : 1];
      if (got) {
        desc = nf(val) + " " + ul;
      } else {
        desc = howText(id, null);
        status = h.not;
        prog = '<div class="bs-prog"><i style="width:' + Math.max(0, Math.min(100, Math.round(100 * val / th.goal))) + '%"></i></div><div class="bs-pl"><span>' + nf(val) + "</span><span>" + nf(th.goal) + '</span></div><div class="bs-nx">' + h.left.replace("{n}", nf(Math.max(0, th.goal - val))).replace("{u}", ul) + "</div>";
      }
    } else if (got) {
      desc = t["d_" + id] || t.special;
    } else {
      desc = howText(id, null);
      status = h.not;
    }
    if (!got && !ACTIVE.test(id)) status = h.not + " · " + h.soon;

    var html = '<div class="bs-top' + (got ? "" : " lk") + '">' + bd(it, 104) + "<h4>" + it.lab() + "</h4><p>" + desc + "</p>" + (status ? '<div class="bs-nx">' + status + "</div>" : "") + "</div>" + prog;
    var own = !!(opts && opts.own), mode = "";
    if (own) {
      if (!got) { html += '<button type="button" class="bs-pin" disabled>' + LOCKSVG + t.lock + "</button>"; }
      else if (data.pinned === id) { mode = "unpin"; html += '<button type="button" class="bs-pin off" data-a="unpin">' + t.unpin + "</button>"; }
      else { mode = "pin"; html += '<button type="button" class="bs-pin" data-a="pin">' + t.pin + "</button>"; }
    }
    var box = el("div");
    box.innerHTML = html;
    sh.appendChild(box);
    var pb = box.querySelector(".bs-pin[data-a]");
    if (pb) pb.addEventListener("click", function () {
      pb.disabled = true;
      FX.api("/api/badge-pin", { method: "PUT", body: { badge_id: mode === "pin" ? id : null } }).then(function (res) {
        if (res.status !== 200 || !res.data || !res.data.badges) { pb.disabled = false; FX.toast(t.fail, true); return; }
        if (opts && opts.onChange) opts.onChange(res.data.badges);
        FX.toast(mode === "pin" ? t.pinned : t.auto);
        sheetBody(sh, data, id, opts);
      }).catch(function () { pb.disabled = false; FX.toast(t.fail, true); });
    });
  }

  FX.badgeSheet = function (data, startId, opts) {
    if (!data) return;
    mountDefs();
    css();
    FX.openSheet(function (sh) { sheetBody(sh, data, startId || data.primary, opts); });
  };

  // the full page with every badge: earned first, the rest dimmed; tap one to open its sheet
  var bpage = null;

  function closeBadgePage() {
    if (!bpage) return;
    bpage.root.remove();
    FX.popBack(bpage.back);
    bpage = null;
  }

  FX.badgePage = function (data, opts) {
    if (!data) return;
    setLang();
    mountDefs();
    css();
    if (bpage) closeBadgePage();
    var t = TXT[lang];
    var have = {};
    (data.earned || []).forEach(function (x) { have[x] = 1; });
    var mine = [], rest = [];
    CATS.forEach(function (c) { c.items.forEach(function (i) { (have[i.id] ? mine : rest).push(i.id); }); });
    function cell(x, lock) {
      return '<button type="button" data-id="' + x + '"><span class="bs-ic">' + (lock ? '<span class="bs-lock">' + bd(ALL[x], 60) + "</span>" : bd(ALL[x], 60)) + '</span><span class="bs-nm' + (lock ? " dim" : "") + '">' + ALL[x].lab() + "</span></button>";
    }
    var root = el("div", "page bpage");
    var back = FX.iconButton("round-btn", "back", t.back, closeBadgePage);
    back.firstChild.classList.add("flip");
    root.appendChild(back);
    var scroller = el("div", "page-scroll");
    var inner = el("div", "bp-in");
    var html = "<h1>" + t.title + '</h1><div class="bp-sub">' + nf(mine.length) + " " + t.of + " " + nf(mine.length + rest.length) + "</div>";
    if (mine.length) html += '<div class="bs-grid">' + mine.map(function (x) { return cell(x, false); }).join("") + "</div>";
    if (rest.length) html += '<div class="bs-sec bs-sec-plain"></div><div class="bs-grid">' + rest.map(function (x) { return cell(x, true); }).join("") + "</div>";
    inner.innerHTML = html;
    scroller.appendChild(inner);
    root.appendChild(scroller);
    Array.prototype.forEach.call(inner.querySelectorAll(".bs-grid button"), function (b) {
      b.addEventListener("click", function () { FX.badgeSheet(data, b.getAttribute("data-id"), opts); });
    });
    bpage = { root: root, back: closeBadgePage };
    document.body.appendChild(root);
    FX.pushBack(closeBadgePage);
  };

  // opts.own = true on your own profile: the sheet then has the "pin next to my name" button
  FX.badgeAttach = function (nameEl, data, opts) {
    if (!nameEl || !data || !data.primary || !ALL[data.primary]) return;
    setLang();
    mountDefs();
    css();
    var old = nameEl.querySelector(".bdg");
    if (old) old.remove();
    var b = el("button", "bdg");
    b.type = "button";
    b.innerHTML = bd(ALL[data.primary], 28);
    var so = { own: !!(opts && opts.own), onChange: function (nb) {
      data.counts = nb.counts; data.earned = nb.earned; data.primary = nb.primary; data.pinned = nb.pinned; data.auto = nb.auto;
      FX.badgeAttach(nameEl, data, opts);
    } };
    b.addEventListener("click", function () { FX.badgePage(data, so); });
    nameEl.appendChild(b);
  };
})();
