// ═══════════════════════════════════════════════════════════════════════
// OB9 — Service Worker (1 ก.ย. 69)
// ที่มา: ผู้ใช้ขอให้ทำเป็น App ที่ติดตั้งได้ (PWA) — ไฟล์นี้คือสิ่งที่ทำให้เบราว์เซอร์เสนอ
// "ติดตั้งแอป"/"Add to Home Screen" ได้ (ร่วมกับ manifest.json) และทำให้เปิดแอปได้แม้
// เน็ตหลุดชั่วขณะ (โหลด shell เดิมจาก cache แทนหน้าเปล่า)
//
// กลยุทธ์แคช: Network-first สำหรับหน้า/สคริปต์ของระบบเอง (เพราะข้อมูล PM/WO/SMU ต้องสด
// ที่สุดเสมอ ไม่ต้องการให้ผู้ใช้เห็นข้อมูลเก่าค้างจาก cache) — ถ้าออนไลน์ได้ปกติจะไม่รู้สึกต่างจากเดิมเลย
// ถ้าออฟไลน์ (เน็ตหลุด) ค่อย fallback ไปใช้สำเนาล่าสุดที่เคยโหลดสำเร็จแทนหน้าเปล่า/error
// ไม่แตะ request ไป Google Sheets/Apps Script (cross-origin) และไม่แตะ POST เด็ดขาด — ปล่อยผ่านตรงเสมอ
// ═══════════════════════════════════════════════════════════════════════

var CACHE_NAME = 'ob9-shell-v1';
var APP_SHELL = [
  'ob9_portal_new.html',
  'ob9_home.html',
  'ob9_pending.html',
  'ob9_shared.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).catch(function () {
        // ไม่ให้ install fail ทั้งหมดถ้าไฟล์ใดไฟล์หนึ่งโหลดไม่สำเร็จตอนติดตั้งครั้งแรก (เช่น เน็ตช้า)
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;

  // ปล่อยผ่านทุก request ที่ไม่ใช่ GET (POST sync ไป Apps Script ต้องไม่ถูกแตะ)
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // ปล่อยผ่าน request ข้าม origin ทั้งหมด (Google Sheets, Apps Script Web App, Google Fonts ฯลฯ)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(function (res) {
      // สำเนาสำเร็จ ถืออัปเดต cache ไว้เป็นสำรองสำหรับตอนออฟไลน์ครั้งถัดไป
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
      return res;
    }).catch(function () {
      // ออฟไลน์ หรือโหลดไม่สำเร็จ — ใช้สำเนาล่าสุดที่เคยแคชไว้แทน
      return caches.match(req).then(function (cached) {
        return cached || Response.error();
      });
    })
  );
});
