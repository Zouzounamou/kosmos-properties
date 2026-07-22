const form = document.getElementById('propertyForm');
const message = document.getElementById('message');

function showMessage(text, ok = false) {
  message.textContent = text;
  message.className = ok ? 'md:col-span-2 text-sm text-green-700' : 'md:col-span-2 text-sm text-red-700';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('Uploading property…', true);

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return window.location.href = 'login.html';

  const file = document.getElementById('image').files[0];
  if (!file) return showMessage('Please choose an image.');

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabaseClient.storage
    .from('property-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) return showMessage(uploadError.message);

  const { data: publicData } = supabaseClient.storage.from('property-images').getPublicUrl(path);
  const payload = {
    agent_id: user.id,
    title: document.getElementById('title').value.trim(),
    country: document.getElementById('country').value.trim(),
    city: document.getElementById('city').value.trim(),
    type: document.getElementById('type').value,
    listing_type: document.getElementById('listingType').value,
    price: Number(document.getElementById('price').value),
    currency: document.getElementById('currency').value,
    bedrooms: document.getElementById('bedrooms').value ? Number(document.getElementById('bedrooms').value) : null,
    bathrooms: document.getElementById('bathrooms').value ? Number(document.getElementById('bathrooms').value) : null,
    size: document.getElementById('size').value.trim() || null,
    description: document.getElementById('description').value.trim(),
    image_url: publicData.publicUrl,
    status: 'pending'
  };
  const { error } = await supabaseClient.from('properties').insert(payload);
  if (error) return showMessage(error.message);
  showMessage('Property submitted successfully. It is pending approval.', true);
  form.reset();
  setTimeout(() => window.location.href = 'dashboard.html', 1200);
});
