const SUPABASE_URL = "https://lwdgpvybeikpcqlnhqcv.supabase.co";
const SUPABASE_KEY = "sb_publishable_XnRwkKeLauxS3b0Lq-_JZw_TmKbqqwc";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser, profile, username;

async function requireUser(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session?.user){ location.href='index.html'; return false; }
  currentUser=session.user;
  const {data:row}=await sb.from('usernames').select('username').eq('user_id',currentUser.id).maybeSingle();
  username=row?.username||'you';
  return true;
}
async function getProfile(){
  const {data}=await sb.from('profiles').select('*').eq('id',currentUser.id).maybeSingle();
  if(data) return data;
  const defaults={id:currentUser.id,name:'Your Name',tagline:'Write a short line about yourself.',details:[],social:[],avatar_path:null};
  await sb.from('profiles').insert(defaults); return defaults;
}
function setMessage(text,type=''){const el=document.querySelector('.message'); if(el){el.textContent=text;el.className=`message ${type}`;}}
async function signOut(){await sb.auth.signOut();location.href='index.html';}
function avatarUrl(path){return path?sb.storage.from('avatars').getPublicUrl(path).data.publicUrl:'';}
