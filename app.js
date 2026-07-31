// Shared config and helpers used by index.html, edit.html, change-password.html
const SUPABASE_URL = "https://lwdgpvybeikpcqlnhqcv.supabase.co";
const SUPABASE_KEY = "sb_publishable_XnRwkKeLauxS3b0Lq-_JZw_TmKbqqwc";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function usernameToInternalEmail(username){
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${clean}.acct@example.com`;
}

function esc(s){ return (s || '').toString().replace(/"/g, '&quot;'); }

function showToast(msg){
  const t = document.getElementById('save-toast');
  if(!t) return;
  if(msg) t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1200);
}

// Redirects to index.html if not logged in. Returns {user, username} otherwise.
async function requireAuth(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session || !session.user){
    window.location.href = 'index.html';
    return null;
  }
  const user = session.user;
  const { data: unameRow } = await sb.from('usernames').select('username').eq('user_id', user.id).maybeSingle();
  const username = unameRow ? unameRow.username : 'you';
  return { user, username };
}

async function doLogout(){
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

async function loadProfile(userId){
  let { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if(!data){
    const defaults = { id: userId, name: "Your Name", tagline: "Write a short line about yourself.", details: [], social: [], avatar_path: null };
    await sb.from('profiles').insert(defaults);
    data = defaults;
  }
  return {
    name: data.name || "Your Name",
    tagline: data.tagline || "",
    details: data.details || [],
    social: data.social || [],
    avatar_path: data.avatar_path || null
  };
}

async function getAvatarUrl(avatarPath){
  if(!avatarPath) return '';
  const { data } = await sb.storage.from('photos').createSignedUrl(avatarPath, 3600);
  return data ? data.signedUrl : '';
}

async function loadGallery(userId){
  const { data } = await sb.from('gallery').select('*').eq('user_id', userId).order('id');
  const items = [];
  for(const row of (data || [])){
    const { data: signed } = await sb.storage.from('photos').createSignedUrl(row.storage_path, 3600);
    items.push({ id: row.id, storage_path: row.storage_path, caption: row.caption, url: signed ? signed.signedUrl : '' });
  }
  return items;
}

async function loadFiles(userId){
  const { data } = await sb.from('files').select('*').eq('user_id', userId).order('id');
  const items = [];
  for(const row of (data || [])){
    const { data: signed } = await sb.storage.from('files').createSignedUrl(row.storage_path, 3600);
    items.push({ id: row.id, storage_path: row.storage_path, label: row.label, fileName: row.storage_path.split('/').pop(), url: signed ? signed.signedUrl : '' });
  }
  return items;
}

// Renders the collapsible dot-menu into #nav-container, excluding the link to the current page.
// currentPage is one of: 'view', 'edit', 'password'
function renderMenu(currentPage){
  const pages = [
    { key: 'view', href: 'index.html', label: 'View Page' },
    { key: 'edit', href: 'edit.html', label: 'Edit Page' },
    { key: 'password', href: 'change-password.html', label: 'Change Password' }
  ];
  const items = pages.filter(p => p.key !== currentPage)
    .map(p => `<a href="${p.href}">${p.label}</a>`).join('');
  const html = `<div class="menu">
      <button class="menu-btn" id="menu-btn" onclick="toggleMenu(event)" aria-label="Menu">&#8942;</button>
      <div class="menu-dropdown" id="menu-dropdown">
        ${items}
        <button onclick="doLogout()">Log Out</button>
      </div>
    </div>`;
  const container = document.getElementById('nav-container');
  if(container) container.innerHTML = html;

  document.addEventListener('click', function(e){
    const dropdown = document.getElementById('menu-dropdown');
    const btn = document.getElementById('menu-btn');
    if(dropdown && dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== btn){
      dropdown.classList.remove('show');
    }
  });
}

function toggleMenu(e){
  if(e) e.stopPropagation();
  document.getElementById('menu-dropdown').classList.toggle('show');
}
