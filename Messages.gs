function listMessages_(ctx) {
  const uid=ctx.user.userId;
  return rows_('Messages').filter(m=>m.senderId===uid||m.receiverId===uid)
    .sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))).slice(-250);
}

function sendMessage_(p,ctx) {
  const body=clean_(p.body,4000); if(!body) throw new Error('Message cannot be empty.');
  const receiver=rows_('Users').find(u=>u.userId!==ctx.user.userId&&String(u.active)!=='false');
  if(!receiver) throw new Error('No second account is registered yet.');
  const m={messageId:id_(),senderId:ctx.user.userId,receiverId:receiver.userId,body,createdAt:now_(),readAt:''};
  append_('Messages',m); log_(ctx.user.userId,'message_sent','To: '+receiver.username); return m;
}

function markMessagesRead_(ctx) {
  const uid=ctx.user.userId, sh=sheet_('Messages'), vals=sh.getDataRange().getValues(), h=vals[0];
  const ri=h.indexOf('receiverId'), read=h.indexOf('readAt'), stamp=now_();
  for(let r=1;r<vals.length;r++) if(vals[r][ri]===uid&&!vals[r][read]) sh.getRange(r+1,read+1).setValue(stamp);
  return {ok:true};
}
