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
