function id_() { return Utilities.getUuid(); }

function now_() { return new Date().toISOString(); }

function clean_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 2000); }

function log_(userId, action, details) {
  append_('ActivityLogs',{logId:id_(),userId,action,details:clean_(details,1000),createdAt:now_()});
}

function publicUser_(u) { return {userId:u.userId,username:u.username,role:u.role}; }

function findUser_(id) { return rows_('Users').find(u => u.userId === id && String(u.active) !== 'false'); }

function findUserByName_(name) { const n=clean_(name,40).toLowerCase(); return rows_('Users').find(u => String(u.username).toLowerCase()===n && String(u.active)!=='false'); }
