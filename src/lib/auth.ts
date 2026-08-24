import { supabase } from "./supabase";

export async function currentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
