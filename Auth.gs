function signup_(p) {
  const username=clean_(p.username,40), password=String(p.password||''), invite=String(p.inviteCode||'');
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) throw new Error('Username must be 3–40 characters using letters, numbers, dots, underscores or hyphens.');
  validatePassword_(password);
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const users=rows_('Users');
    if (users.length >= CFG.MAX_USERS) throw new Error('This private workspace already has its two accounts.');
    if (findUserByName_(username)) throw new Error('That username is already taken.');
    const expected=PropertiesService.getScriptProperties().getProperty('INVITE_CODE');
    if (!expected || invite !== expected) throw new Error('Invalid invitation code.');
    const salt=id_()+id_(), userId=id_(), hash=hashPassword_(password,salt);
    const role=users.length===0?'admin':'member';
    append_('Users',{userId,username,passwordHash:hash,salt,role,createdAt:now_(),active:true});
    append_('Presence',{userId,status:'offline',lastHeartbeat:'',lastActive:now_()});
    log_(userId,'account_created','Role: '+role);
    return createSession_(findUser_(userId));
  } finally { lock.releaseLock(); }
}

function login_(p) {
  const u=findUserByName_(p.username);
  if (!u || hashPassword_(String(p.password||''),u.salt)!==u.passwordHash) throw new Error('Incorrect username or password.');
  return createSession_(u);
}

function createSession_(u) {
  const token=Utilities.getUuid()+Utilities.getUuid(), created=now_(), expires=new Date(Date.now()+CFG.SESSION_HOURS*3600000).toISOString();
  append_('Sessions',{sessionId:id_(),userId:u.userId,tokenHash:sha256_(token),createdAt:created,expiresAt:expires,lastSeen:created,revoked:false});
  log_(u.userId,'login','Session created');
  return {ok:true,token,user:publicUser_(u)};
}

function authenticate_(token) {
  if (!token || String(token).length<30) throw new Error('Please sign in again.');
  const digest=sha256_(String(token)), s=rows_('Sessions').find(x=>x.tokenHash===digest && String(x.revoked)!=='true');
  if (!s || new Date(s.expiresAt).getTime()<Date.now()) throw new Error('Your session expired. Please sign in again.');
  const u=findUser_(s.userId); if (!u) throw new Error('Account is unavailable.');
  updateById_('Sessions','sessionId',s.sessionId,{lastSeen:now_()});
  return {session:s,user:u};
}

function validatePassword_(p) { if (p.length<10 || p.length>128) throw new Error('Password must be 10–128 characters.'); }

function hashPassword_(password,salt) {
  let value=salt+'|'+password;
  for (let i=0;i<CFG.HASH_ITERATIONS;i++) value=Utilities.base64Encode(Utilities.computeHmacSha256Signature(value,salt));
  return value;
}

function sha256_(s) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8)); }

function changePassword_(p,ctx) {
  const old=String(p.currentPassword||''), next=String(p.newPassword||'');
  if(hashPassword_(old,ctx.user.salt)!==ctx.user.passwordHash) throw new Error('Current password is incorrect.');
  validatePassword_(next); const salt=id_()+id_();
  updateById_('Users','userId',ctx.user.userId,{salt,passwordHash:hashPassword_(next,salt)});
  log_(ctx.user.userId,'password_changed','Password updated');
  return {changed:true};
}

function resetRequest_(p) {
  const username=clean_(p.username,40), u=findUserByName_(username);
  if(!u) throw new Error('If the account exists, an administrator can issue a reset code.');
  if(u.role!=='member') throw new Error('Ask the workspace administrator to generate a reset code.');
  return {message:'Ask the workspace administrator to generate a one-time reset code for your username.'};
}

function generatePasswordResetCode(username) {
  const u=findUserByName_(username); if(!u) throw new Error('User not found.');
  const code=String(Math.floor(10000000+Math.random()*90000000));
  PropertiesService.getScriptProperties().setProperty('RESET_'+u.userId,JSON.stringify({hash:sha256_(code),expires:Date.now()+15*60*1000}));
  return 'One-time reset code for '+u.username+': '+code+' (expires in 15 minutes). Share privately.';
}

function resetPassword_(p) {
  const u=findUserByName_(p.username), code=String(p.resetCode||''), next=String(p.newPassword||'');
  if(!u) throw new Error('Invalid reset request.');
  const prop=PropertiesService.getScriptProperties().getProperty('RESET_'+u.userId);
  if(!prop) throw new Error('No active reset code. Ask the administrator.');
  const data=JSON.parse(prop);
  if(Date.now()>data.expires||sha256_(code)!==data.hash) throw new Error('Invalid or expired reset code.');
  validatePassword_(next); const salt=id_()+id_();
  updateById_('Users','userId',u.userId,{salt,passwordHash:hashPassword_(next,salt)});
  PropertiesService.getScriptProperties().deleteProperty('RESET_'+u.userId);
  rows_('Sessions').filter(s=>s.userId===u.userId).forEach(s=>updateById_('Sessions','sessionId',s.sessionId,{revoked:true}));
  log_(u.userId,'password_reset','Password reset completed'); return {reset:true};
}


function setCreatorHubInviteCode(code) {
  code=String(code||'').trim();
  if(code.length<12) throw new Error('Use an invitation code of at least 12 characters.');
  PropertiesService.getScriptProperties().setProperty('INVITE_CODE',code);
  return 'Invitation code saved. Share it privately with only the two authorized users.';
}
