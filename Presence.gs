function heartbeat_(ctx) {
  const uid=ctx.user.userId, stamp=now_(), p=rows_('Presence').find(x=>x.userId===uid);
  if(p) updateById_('Presence','userId',uid,{status:'online',lastHeartbeat:stamp,lastActive:stamp});
  else append_('Presence',{userId:uid,status:'online',lastHeartbeat:stamp,lastActive:stamp});
  return {at:stamp};
}

function setOffline_(uid) {
  const p=rows_('Presence').find(x=>x.userId===uid);
  if(p) updateById_('Presence','userId',uid,{status:'offline',lastActive:p.lastHeartbeat||now_()});
}

function presenceList_() {
  const users=rows_('Users').filter(u=>String(u.active)!=='false'), presence=rows_('Presence');
  return users.map(u=>{
    const p=presence.find(x=>x.userId===u.userId), hb=p&&p.lastHeartbeat, online=!!hb&&(Date.now()-new Date(hb).getTime())/1000<CFG.PRESENCE_SECONDS;
    if(p && !online && p.status!=='offline') updateById_('Presence','userId',u.userId,{status:'offline',lastActive:hb||p.lastActive});
    return {userId:u.userId,username:u.username,status:online?'online':'offline',lastActive:online?hb:(p&&(p.lastActive||hb)||'')};
  });
}
