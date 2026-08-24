import type { ProfileStore } from "./profile";
import type { ScanHistoryEntry } from "./history";
import { supabase } from "./supabase";

async function uid() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
export async function pushProfileStore(store: ProfileStore) {
  const userId = await uid(); if (!userId || !supabase) return;
  await supabase.from("user_profiles").delete().eq("user_id", userId);
  if (store.profiles.length) await supabase.from("user_profiles").insert(store.profiles.map(p => ({id:p.id, user_id:userId, createdAt:p.createdAt, active:p.id===store.activeId, name:p.name, data:p})));
}
export async function pullProfileStore(): Promise<ProfileStore | null> {
  const userId=await uid(); if(!userId || !supabase) return null;
  const {data,error}=await supabase.from("user_profiles").select("*").eq("user_id",userId).order("createdAt",{ascending:true});
  if(error || !data?.length) return null;
  const profiles=data.map(({user_id,active,data,...p}: any)=>data ?? p);
  return {profiles, activeId:(data.find((p:any)=>p.active)?.id ?? profiles[0].id)};
}
export async function pushHistory(entries: ScanHistoryEntry[]) {
  const userId=await uid(); if(!userId || !supabase) return;
  await supabase.from("scan_history").delete().eq("user_id",userId);
  if(entries.length) await supabase.from("scan_history").insert(entries.map(e=>({...e,user_id:userId})));
}
export async function pullHistory(): Promise<ScanHistoryEntry[] | null> {
  const userId=await uid(); if(!userId || !supabase) return null;
  const {data,error}=await supabase.from("scan_history").select("*").eq("user_id",userId).order("createdAt",{ascending:false});
  if(error) return null; return (data ?? []).map(({user_id,...e}:any)=>e);
}
