function dashboard_(ctx) {
  const tasks=rows_('Tasks'), msgs=rows_('Messages'), content=rows_('ContentPlans');
  return {tasks:tasks.length,
    completed:tasks.filter(t=>t.status==='Done').length,
    unread:msgs.filter(m=>m.receiverId===ctx.user.userId&&!m.readAt).length, content:content.length,
    users:rows_('Users').filter(u=>String(u.active)!=='false').map(publicUser_)};
}

function listTasks_(ctx) {
  return rows_('Tasks').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}

function createTask_(p,ctx) {
  const title=clean_(p.title,120); if (!title) throw new Error('Task title is required.');
  const assignee=p.assignedTo ? findUser_(p.assignedTo) : ctx.user;
  if (!assignee) throw new Error('Invalid assignee.');
  const task={taskId:id_(),createdBy:ctx.user.userId,assignedTo:assignee.userId,title,description:clean_(p.description,2000),
    priority:['Low','Medium','High'].includes(p.priority)?p.priority:'Medium',status:'To do',dueDate:clean_(p.dueDate,30),createdAt:now_(),updatedAt:now_()};
  append_('Tasks',task); log_(ctx.user.userId,'task_created',title); return task;
}

function updateTask_(p,ctx) {
  const t=rows_('Tasks').find(x=>x.taskId===p.taskId);
  if (!t || (t.createdBy!==ctx.user.userId && t.assignedTo!==ctx.user.userId)) throw new Error('Task not found or not authorized.');
  const patch={updatedAt:now_()};
  if (p.title!==undefined) { const v=clean_(p.title,120); if(!v) throw new Error('Title is required.'); patch.title=v; }
  if (p.description!==undefined) patch.description=clean_(p.description,2000);
  if (p.priority!==undefined && ['Low','Medium','High'].includes(p.priority)) patch.priority=p.priority;
  if (p.status!==undefined && ['To do','In progress','Done'].includes(p.status)) patch.status=p.status;
  if (p.dueDate!==undefined) patch.dueDate=clean_(p.dueDate,30);
  if (p.assignedTo!==undefined) { const u=findUser_(p.assignedTo); if(!u) throw new Error('Invalid assignee.'); patch.assignedTo=u.userId; }
  updateById_('Tasks','taskId',t.taskId,patch); return Object.assign({},t,patch);
}

function deleteTask_(p,ctx) {
  const t=rows_('Tasks').find(x=>x.taskId===p.taskId);
  if (!t || t.createdBy!==ctx.user.userId) throw new Error('Only the task creator can delete it.');
  deleteById_('Tasks','taskId',t.taskId); return {deleted:true};
}
