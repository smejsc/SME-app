/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   Seahorse Manager — máy chủ v1.83.0 · MailSendAs.gs
   Email giao việc gửi TỪ HỘP THƯ @seahorse.com.vn CỦA NGƯỜI GIAO qua Gmail API
   (service account erp-mailer@seahorse-manager-mail.iam.gserviceaccount.com + Domain-wide delegation, scope gmail.send).

   CÀI ĐẶT (1 lần):
   1. Apps Script của máy chủ app → Project Settings → Script Properties → thêm:
        GMAIL_SA_KEY   = (dán TOÀN BỘ nội dung file seahorse-manager-mail-37dfb0aa6a79.json)
        MAIL_LOG_SHEET = (tuỳ chọn) ID Google Sheet để ghi nhật ký — bỏ trống thì ghi vào Spreadsheet đang gắn script
   2. Thêm file này vào project (New file → Script → MailSendAs).
   3. Trong doPost, NGAY SAU đoạn kiểm token/session + chữ ký ghi (giống lệnh 'send_email'), thêm 2 dòng:
        if (action === 'mail_sa_status') return _mailJson_(mailSaStatus_(body));
        if (action === 'mail_send_as')   return _mailJson_(mailSendAs_(body));
      (body = object JSON đã parse từ e.postData.contents; action = body.action)
   4. Deploy → Manage deployments → Edit → New version (giữ nguyên URL).
   5. Trong app: bấm ✉ Gửi lại email ở 1 việc thử → Nhật ký việc ghi "(đã gửi từ …)" là chạy.

   GIỚI HẠN:
   • Người gửi và MỌI người nhận (to/cc/bcc) phải là @seahorse.com.vn.
   • Chỉ các loại thư trong MAIL_EVENTS_ (hiện: 'vr_assign' — email giao việc Vessel Requests).
   • Tối đa 50 thư / người gửi / ngày.
   • Thư luôn có chân "Gửi qua Seahorse Manager ERP" + header X-SME-ERP: 1.
   • Nhật ký sheet MAIL_LOG: thời điểm, người gửi, người nhận, tiêu đề, loại, kết quả, messageId, lỗi — KHÔNG lưu nội dung.
   ⚠ Máy chủ chưa phân biệt được người gọi (token dùng chung) — các giới hạn trên là lớp chặn tạm thời.
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */

var MAIL_DOMAIN_ = '@seahorse.com.vn';
var MAIL_EVENTS_ = ['vr_assign'];
var MAIL_DAILY_MAX_ = 50;

function _mailJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function _mailIsCo_(e) { e = String(e || '').trim().toLowerCase(); return e.length > MAIL_DOMAIN_.length && e.slice(-MAIL_DOMAIN_.length) === MAIL_DOMAIN_; }
function _mailList_(v) { return [].concat(v || []).map(function (x) { return String(x || '').trim().toLowerCase(); }).filter(function (x) { return x; }); }
function _b64url_(bytesOrStr) {
  return Utilities.base64EncodeWebSafe(bytesOrStr).replace(/=+$/, '');
}
function _mailKey_() {
  var raw = PropertiesService.getScriptProperties().getProperty('GMAIL_SA_KEY');
  if (!raw) throw new Error('NOT_CONFIGURED: thiếu Script Property GMAIL_SA_KEY');
  var k = JSON.parse(raw);
  if (!k.client_email || !k.private_key) throw new Error('NOT_CONFIGURED: GMAIL_SA_KEY sai định dạng');
  return k;
}
/* Access token Gmail cho đúng người gửi (sub = from) — nhớ tạm 50 phút */
function _mailToken_(from) {
  var cache = CacheService.getScriptCache(), ck = 'gtok_' + from;
  var hit = cache.get(ck); if (hit) return hit;
  var k = _mailKey_(), now = Math.floor(Date.now() / 1000);
  var head = _b64url_(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var claim = _b64url_(JSON.stringify({
    iss: k.client_email, sub: from, scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: k.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  }));
  var input = head + '.' + claim;
  var sig = _b64url_(Utilities.computeRsaSha256Signature(input, k.private_key));
  var res = UrlFetchApp.fetch(k.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: input + '.' + sig }
  });
  var d = JSON.parse(res.getContentText() || '{}');
  if (!d.access_token) throw new Error('DELEGATION: ' + (d.error_description || d.error || ('HTTP ' + res.getResponseCode())));
  cache.put(ck, d.access_token, 3000);
  return d.access_token;
}
function _mailQuota_(from, add) {
  var p = PropertiesService.getScriptProperties();
  var key = 'MAILQ_' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd') + '_' + from;
  var n = +(p.getProperty(key) || 0);
  if (add) p.setProperty(key, String(n + add));
  return n;
}
function _mailLog_(row) {
  try {
    var id = PropertiesService.getScriptProperties().getProperty('MAIL_LOG_SHEET');
    var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var sh = ss.getSheetByName('MAIL_LOG');
    if (!sh) { sh = ss.insertSheet('MAIL_LOG'); sh.appendRow(['Thời điểm', 'Người gửi', 'Người nhận', 'CC', 'Tiêu đề', 'Loại', 'Mã tham chiếu', 'Kết quả', 'messageId', 'Lỗi']); }
    sh.appendRow(row);
  } catch (e) { /* nhật ký lỗi không chặn gửi */ }
}
function _mailEncHdr_(s) { return '=?UTF-8?B?' + Utilities.base64Encode(Utilities.newBlob(String(s || '')).getBytes()) + '?='; }
function _mailMime_(from, to, cc, subject, text, blobs) {
  var B = 'sme_' + Utilities.getUuid().replace(/-/g, '');
  var L = [];
  L.push('From: ' + from, 'To: ' + to.join(', '));
  if (cc.length) L.push('Cc: ' + cc.join(', '));
  L.push('Subject: ' + _mailEncHdr_(subject), 'MIME-Version: 1.0', 'X-SME-ERP: 1',
         'Content-Type: multipart/mixed; boundary="' + B + '"', '',
         '--' + B, 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
         Utilities.base64Encode(Utilities.newBlob(text).getBytes()));
  (blobs || []).forEach(function (b) {
    L.push('--' + B, 'Content-Type: ' + (b.getContentType() || 'application/octet-stream') + '; name="' + _mailEncHdr_(b.getName()) + '"',
           'Content-Disposition: attachment; filename="' + _mailEncHdr_(b.getName()) + '"', 'Content-Transfer-Encoding: base64', '',
           Utilities.base64Encode(b.getBytes()));
  });
  L.push('--' + B + '--');
  return L.join('\r\n');
}

/* action 'mail_sa_status' → {ok:true, ready:bool, error?} — app hỏi trước khi gửi */
function mailSaStatus_(body) {
  try {
    _mailKey_();
    var from = String(body && body.from || '').trim().toLowerCase();
    if (from && _mailIsCo_(from)) _mailToken_(from);
    return { ok: true, ready: true, version: 'v1.83.0' };
  } catch (e) { return { ok: true, ready: false, error: String(e && e.message || e) }; }
}

/* action 'mail_send_as' — {from, to[], cc[], bcc[], subject, body, attachments:[{driveId,fileName}], event, refIds[]} */
function mailSendAs_(body) {
  var from = String(body && body.from || '').trim().toLowerCase();
  var to = _mailList_(body && body.to), cc = _mailList_(body && body.cc).filter(function (x) { return to.indexOf(x) < 0; });
  var bcc = _mailList_(body && body.bcc);
  var subject = String(body && body.subject || '').slice(0, 250);
  var ev = String(body && body.event || '');
  var ref = [].concat(body && body.refIds || []).join(',');
  var fail = function (msg) { _mailLog_([new Date(), from, to.join(', '), cc.join(', '), subject, ev, ref, 'LỖI', '', msg]); return { ok: false, error: msg }; };
  if (!_mailIsCo_(from)) return fail('SENDER_NOT_DOMAIN: người gửi phải là ' + MAIL_DOMAIN_);
  if (!to.length) return fail('NO_RECIPIENT');
  var all = to.concat(cc, bcc);
  for (var i = 0; i < all.length; i++) if (!_mailIsCo_(all[i])) return fail('RECIPIENT_NOT_DOMAIN: ' + all[i]);
  if (MAIL_EVENTS_.indexOf(ev) < 0) return fail('EVENT_NOT_ALLOWED: ' + ev);
  if (_mailQuota_(from, 0) >= MAIL_DAILY_MAX_) return fail('QUOTA: quá ' + MAIL_DAILY_MAX_ + ' thư/ngày cho ' + from);
  try {
    var text = String(body && body.body || '') + '\n\n—\nGửi qua Seahorse Manager ERP · người thao tác: ' + from;
    var blobs = [];
    [].concat(body && body.attachments || []).slice(0, 5).forEach(function (a) {
      if (a && a.driveId) { var bl = DriveApp.getFileById(a.driveId).getBlob(); if (a.fileName) bl.setName(a.fileName); blobs.push(bl); }
    });
    var mime = _mailMime_(from, to, cc, subject, text, blobs);
    if (bcc.length) mime = 'Bcc: ' + bcc.join(', ') + '\r\n' + mime;
    var tok = _mailToken_(from);
    var res = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + tok },
      payload: JSON.stringify({ raw: Utilities.base64EncodeWebSafe(Utilities.newBlob(mime).getBytes()) })
    });
    var d = JSON.parse(res.getContentText() || '{}');
    if (res.getResponseCode() >= 300 || !d.id) return fail('GMAIL: ' + ((d.error && d.error.message) || ('HTTP ' + res.getResponseCode())));
    _mailQuota_(from, 1);
    _mailLog_([new Date(), from, to.join(', '), cc.join(', '), subject, ev, ref, 'OK', d.id, '']);
    return { ok: true, sent: true, messageId: d.id };
  } catch (e) { return fail(String(e && e.message || e)); }
}
