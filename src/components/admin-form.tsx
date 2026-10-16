'use client';
import { useActionState,useEffect,type ReactNode } from 'react';
import { manageStudio } from '../app/admin/actions';
import {track} from '../lib/analytics';
export function AdminForm({kind,title,children}:{kind:string;title:string;children:ReactNode}) {
  const [state,action,pending]=useActionState(manageStudio,{message:''});
  useEffect(()=>{if(state.rewardId)track({event:'claim_reward',event_id:state.rewardId});},[state.rewardId]);
  return <form action={action} className="platform-card platform-form"><h2>{title}</h2><input name="kind" type="hidden" value={kind}/>{children}<button disabled={pending}>{pending?'Guardando…':'Guardar'}</button><p role="status">{state.message}</p></form>;
}
