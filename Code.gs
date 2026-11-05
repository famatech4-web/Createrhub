const CFG = {
  SHEETS: {
    Users: ['userId','username','passwordHash','salt','role','createdAt','active'],
    Tasks: ['taskId','createdBy','assignedTo','title','description','priority','status','dueDate','createdAt','updatedAt'],
    Messages: ['messageId','senderId','receiverId','body','createdAt','readAt'],
    ContentPlans: ['contentId','createdBy','platform','title','idea','script','publishDate','status','createdAt','updatedAt'],
    ActivityLogs: ['logId','userId','action','details','createdAt'],
    Sessions: ['sessionId','userId','tokenHash','createdAt','expiresAt','lastSeen','revoked'],
    Presence: ['userId','status','lastHeartbeat','lastActive']
  },
  SESSION_HOURS: 72,
  PRESENCE_SECONDS: 75,
  MAX_USERS: 2,
  HASH_ITERATIONS: 12000
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('CreatorHub')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

function apiCall(action, payload, token) {
  payload = payload || {};
  try {
    if (action === 'signup') return signup_(payload);
    if (action === 'login') return login_(payload);
    if (action === 'resetPassword') return resetPassword_(payload);
    if (action === 'resetRequest') return resetRequest_(payload);
    if (action === 'health') return {ok:true, time:now_()};
    const session = authenticate_(token);
    const result = dispatch_(action, payload, session);
    return {ok:true, data:result};
  } catch (e) {
    return {ok:false,error:String(e && e.message ? e.message : e)};
  }
}

function dispatch_(a,p,ctx) {
  const uid=ctx.user.userId;
  switch(a) {
    case 'me': return publicUser_(ctx.user);
    case 'logout': updateById_('Sessions','sessionId',ctx.session.sessionId,{revoked:true}); setOffline_(uid); return {loggedOut:true};
    case 'changePassword': return changePassword_(p,ctx);
    case 'dashboard': return dashboard_(ctx);
    case 'tasks.list': return listTasks_(ctx);
    case 'tasks.create': return createTask_(p,ctx);
    case 'tasks.update': return updateTask_(p,ctx);
    case 'tasks.delete': return deleteTask_(p,ctx);
    case 'messages.list': return listMessages_(ctx);
    case 'messages.send': return sendMessage_(p,ctx);
    case 'messages.read': return markMessagesRead_(ctx);
    case 'content.list': return rows_('ContentPlans').sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    case 'content.save': return saveContent_(p,ctx);
    case 'content.delete': return deleteContent_(p,ctx);
    case 'presence.heartbeat': return heartbeat_(ctx);
    case 'presence.list': return presenceList_();
    default: throw new Error('Unknown operation.');
  }
}
