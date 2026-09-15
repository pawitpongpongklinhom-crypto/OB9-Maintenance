// ═══════════════════════════════════════════════════════════════════════
// OB9 — ไฟล์กลางที่ทุกหน้าเรียกใช้ร่วมกัน (19 ส.ค. 69)
// ที่มา: หลายบั๊ก (สถานะ "cancelled"/"undefined" โผล่ดิบๆ, ลิงก์เจาะจงหายตอน login)
// มีต้นตอเดียวกัน — โค้ดชุดนี้เคยถูกก็อปวางแยกไว้คนละไฟล์ 5-6 ที่ (ob9_wo_form.html,
// ob9_dashboard.html, ob9_inspect.html, ob9_lubrication.html, ob9_executive.html,
// ob9_pending.html) แก้บั๊ก 1 เรื่องเคยต้องไล่แก้ทุกไฟล์ ตอนนี้รวมไว้ที่นี่ที่เดียว
// แก้ตรงนี้ที่เดียว ทุกหน้าที่ include ไฟล์นี้ได้ผลลัพธ์ตรงกันทันที
//
// วิธีใช้: <script src="ob9_shared.js"></script> ก่อน <script> อื่นที่จะเรียก OB9.*
// ═══════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  // ── คำแปลสถานะ WO ภาษาไทย — จุดเดียวที่เป็นความจริง (single source of truth) ──
  // เดิมแต่ละไฟล์มีชุดคำแปลของตัวเอง บางไฟล์เขียน "เสร็จสิ้น" บางไฟล์เขียน "เสร็จแล้ว"
  // บางไฟล์ลืมใส่ cancelled เลยไปโผล่เป็นคำอังกฤษดิบหรือ "undefined" — รวมเป็นชุดเดียวแล้ว
  var STATUS_LABEL = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จแล้ว',
    cancelled: 'ยกเลิก'
  };

  // ── Access Gate กลาง — แทนโค้ดที่เคยก็อปวางซ้ำ ~10-15 บรรทัดในทุกหน้า ──
  // opts.target      : ค่า target ที่จะส่งให้ ob9_portal_new.html (เช่น 'workorder','inspection')
  // opts.permission  : ชื่อ permission key ที่พนักงาน (type:'field') ต้องมีถึงจะเข้าได้ (ไม่ใส่ = ไม่เช็ค)
  // opts.adminOnly   : true = อนุญาตเฉพาะ isSuperAdmin เท่านั้น (พนักงานทั่วไปเข้าไม่ได้แม้มี permission)
  // คืนค่า: session object ถ้าผ่านด่าน, null ถ้าโดน redirect ออกไปแล้ว (หน้าที่เรียกควร return ทันทีถ้าได้ null)
  function requireLogin(opts) {
    opts = opts || {};
    var target = opts.target || '';
    var permission = opts.permission || null;
    var adminOnly = !!opts.adminOnly;
    // (19 ส.ค. 69) แนบ query string เดิมของหน้านี้ไปกับ &return= เสมอ กัน deep-link (เช่น ?openWO=WO-0029
    // หรือ ?editWO=WO-0029) หายไปตอนโดนเด้งไป login — Portal จะต่อกลับพารามิเตอร์นี้ให้หลัง login สำเร็จ
    var qs = global.location.search ? '&return=' + encodeURIComponent(global.location.search) : '';
    try {
      var s = JSON.parse(global.sessionStorage.getItem('ob9_session') || 'null');
      if (!s || !s.type) {
        global.location.replace('ob9_portal_new.html?target=' + encodeURIComponent(target) + qs);
        return null;
      }
      if (s.isSuperAdmin) return s; // Admin เข้าได้ทุกส่วนเสมอ ไม่ต้องเช็ค permission ต่อ
      if (adminOnly) {
        global.location.replace('ob9_home.html');
        return null;
      }
      if (permission && !(s.type === 'field' && s.permissions && s.permissions[permission])) {
        global.location.replace('ob9_home.html');
        return null;
      }
      return s;
    } catch (e) {
      global.location.replace('ob9_portal_new.html' + (target ? '?target=' + encodeURIComponent(target) : ''));
      return null;
    }
  }

  global.OB9 = global.OB9 || {};
  global.OB9.STATUS_LABEL = STATUS_LABEL;
  global.OB9.requireLogin = requireLogin;
})(window);


// ══════════════════════════════════════════════════════════════════════
// ปุ่มย้อนกลับ 2 แบบ มุมซ้ายบน — ติดหน้าจอตลอด (14 ก.ย. 69)
// ที่มา: ผู้ใช้เข้าหน้าลึก ๆ แล้วถอยกลับไม่ได้ โดยเฉพาะตอนเปิดผ่าน App (PWA
// โหมด standalone) ซึ่งไม่มีแถบเบราว์เซอร์ ไม่มีปุ่ม back ของระบบให้กดเลย
//   ‹ ย้อนกลับ = ถอยทีละหน้าตามประวัติ · ⌂ หน้าหลัก = กลับ ob9_home.html ทันที
// วางไว้ในไฟล์กลางนี้ ทุกหน้าที่ include ob9_shared.js จึงได้ปุ่มทันทีโดยไม่ต้องแก้ HTML
// ══════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';
  var HOME = 'ob9_home.html';
  var NO_NAV = ['ob9_portal_new.html', 'index.html', '']; // หน้า login ไม่ต้องมีปุ่มถอย

  function initBackNav() {
    if (document.getElementById('ob9BackNav')) return;        // กันซ้ำถ้าถูกเรียก 2 รอบ
    var here = (global.location.pathname.split('/').pop() || '').toLowerCase();
    if (NO_NAV.indexOf(here) !== -1) return;
    var onHome = (here === HOME);

    function bgOf(el) { return el ? getComputedStyle(el).backgroundColor : ''; }
    function isClear(c) { return !c || c === 'transparent' || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c); }
    function lum(c) {
      var m = (c || '').match(/\d+/g);
      return m ? (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 : 1;
    }

    // เลือกโทนปุ่มตามความสว่างพื้นหลังจริง — ใช้ได้ทั้งแดชบอร์ดมืดและหน้าคู่มือสว่าง
    var bg = bgOf(document.body);
    if (isClear(bg)) bg = bgOf(document.documentElement);
    if (isClear(bg)) bg = 'rgb(255,255,255)';
    var dark = lum(bg) < 0.5;
    var face = dark ? 'rgba(28,33,48,.92)'    : 'rgba(255,255,255,.94)';
    var line = dark ? 'rgba(148,163,184,.35)' : 'rgba(20,33,61,.16)';
    var ink  = dark ? '#cbd5e1'               : '#14213D';


    // เปิดผ่าน App ไม่มีแถบเบราว์เซอร์คั่น ปุ่มจะซ้อนใต้แถบสถานะ/รอยบาก — เว้น safe-area
    // (บนเบราว์เซอร์ปกติ env() = 0 จึงไม่กระทบ) และขยายปุ่มเมื่อเป็นจอสัมผัส
    var standalone = (global.matchMedia && matchMedia('(display-mode: standalone)').matches)
                     || navigator.standalone === true;
    var touch = standalone || (global.matchMedia && matchMedia('(pointer: coarse)').matches);

    var wrap = document.createElement('div');
    wrap.id = 'ob9BackNav';
    wrap.setAttribute('aria-label', 'นำทางย้อนกลับ');
    // (14 ก.ย. 69) ย้ายจากซ้ายบนมาซ้ายล่าง: ซ้ายบนไปทับหัวข้อของหน้า (เช่นหน้าคู่มือ)
    // ล่างซ้ายไม่มีเนื้อหาชน และนิ้วโป้งเอื้อมถึงง่ายกว่าตอนถือมือถือ
    wrap.style.cssText = 'position:fixed;'
      + 'bottom:calc(14px + env(safe-area-inset-bottom, 0px));'
      + 'left:calc(12px + env(safe-area-inset-left, 0px));z-index:99999;'
      + 'display:flex;gap:6px;font-family:inherit';

    function btn(label, title, fn) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.title = title;
      b.style.cssText = 'background:' + face + ';color:' + ink + ';border:1px solid ' + line + ';'
        + 'border-radius:8px;cursor:pointer;'
        + (touch ? 'padding:11px 15px;font-size:13.5px;' : 'padding:6px 11px;font-size:12px;')
        + 'font-family:inherit;font-weight:700;line-height:1.2;'
        + '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);'
        + 'box-shadow:0 1px 6px rgba(0,0,0,.18)';
      b.addEventListener('click', fn);
      wrap.appendChild(b);
    }

    // ถ้าเปิดหน้านี้เป็นหน้าแรก (ไม่มีประวัติให้ถอย) ให้พาไปหน้าหลักแทน
    // กันอาการกดปุ่มแล้วไม่เกิดอะไรขึ้น
    btn('\u2039 ย้อนกลับ', 'ถอยกลับทีละหน้า', function () {
      if (history.length > 1) history.back(); else global.location.href = HOME;
    });
    if (!onHome) {
      btn('\u2302 หน้าหลัก', 'กลับหน้าเมนูรวม OB9', function () { global.location.href = HOME; });
    }

    document.body.appendChild(wrap);
    var st = document.createElement('style');
    st.textContent = '@media print{#ob9BackNav{display:none!important}}';
    document.head.appendChild(st);
  }

  global.OB9 = global.OB9 || {};
  global.OB9.initBackNav = initBackNav;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackNav);
  } else {
    initBackNav();
  }
})(window);
