function saveContent_(p,ctx) {
  const title=clean_(p.title,160); if(!title) throw new Error('Content title is required.');
  const allowed=['YouTube','TikTok','Both']; if(!allowed.includes(p.platform)) throw new Error('Choose a platform.');
  const status=['Idea','Scripting','Editing','Scheduled','Published'].includes(p.status)?p.status:'Idea';
  const contentId=p.contentId||id_(), old=rows_('ContentPlans').find(x=>x.contentId===contentId);
  if(old && old.createdBy!==ctx.user.userId && ctx.user.role!=='admin') throw new Error('Not authorized to edit this plan.');
  const obj={contentId,createdBy:old?old.createdBy:ctx.user.userId,platform:p.platform,title,idea:clean_(p.idea,3000),
    script:clean_(p.script,10000),publishDate:clean_(p.publishDate,30),status,createdAt:old?old.createdAt:now_(),updatedAt:now_()};
  if(old) updateById_('ContentPlans','contentId',contentId,obj); else append_('ContentPlans',obj);
  return obj;
}

function deleteContent_(p,ctx) {
  const c=rows_('ContentPlans').find(x=>x.contentId===p.contentId);
  if(!c || (c.createdBy!==ctx.user.userId&&ctx.user.role!=='admin')) throw new Error('Not authorized.');
  deleteById_('ContentPlans','contentId',c.contentId); return {deleted:true};
}
