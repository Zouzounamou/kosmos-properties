(async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return window.location.href = 'login.html';
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });
  const { data, error } = await supabaseClient.from('properties').select('*').eq('agent_id', user.id).order('created_at', { ascending: false });
  const grid = document.getElementById('listingGrid');
  if (error) return grid.innerHTML = `<p class="text-red-700">${error.message}</p>`;
  if (!data?.length) return grid.innerHTML = '<div class="md:col-span-2 lg:col-span-3 border border-gold/20 p-10 text-center"><h2 class="font-serif text-2xl">No properties yet</h2><p class="text-muted mt-2">Create your first listing.</p></div>';
  grid.innerHTML = data.map(p => `<article class="bg-white border border-gold/20"><img src="${p.image_url || 'https://placehold.co/800x500'}" class="w-full h-48 object-cover"><div class="p-5"><div class="flex justify-between gap-3"><h2 class="font-serif text-xl">${p.title}</h2><span class="text-[.65rem] uppercase tracking-widest px-2 py-1 bg-gold/20">${p.status}</span></div><p class="text-sm text-muted mt-2">${p.city}, ${p.country}</p><p class="mt-3 font-medium">${p.currency} ${Number(p.price || 0).toLocaleString()}</p></div></article>`).join('');
})();
