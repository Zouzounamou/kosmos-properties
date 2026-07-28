const propertyForm = document.getElementById('propertyForm');
const message = document.getElementById('message');
const submitButton = propertyForm?.querySelector('button[type="submit"]');

function showMessage(text, ok = false) {
  if (!message) return;

  message.textContent = text;
  message.className = ok
    ? 'text-sm text-green-700'
    : 'text-sm text-red-700';
}

function createSafeFilename(filename) {
  const extension = filename.includes('.')
    ? filename.split('.').pop().toLowerCase()
    : 'jpg';

  const basename = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return `${Date.now()}-${crypto.randomUUID()}-${basename || 'property'}.${extension}`;
}

async function uploadPropertyImages({
  files,
  userId,
  propertyId
}) {
  const uploadedImages = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];

    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} is not an image.`);
    }

    if (file.size > 6 * 1024 * 1024) {
      throw new Error(`${file.name} is larger than 6 MB.`);
    }

    const filename = createSafeFilename(file.name);
    const storagePath = `${userId}/${propertyId}/${filename}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('property-images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from('property-images')
      .getPublicUrl(storagePath);

    uploadedImages.push({
      property_id: propertyId,
      image_url: publicUrlData.publicUrl,
      storage_path: storagePath,
      sort_order: index
    });
  }

  if (uploadedImages.length > 0) {
    const { error: imageInsertError } = await supabaseClient
      .from('property_images')
      .insert(uploadedImages);

    if (imageInsertError) {
      throw imageInsertError;
    }
  }

  return uploadedImages;
}

if (propertyForm) {
  propertyForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Saving property…';
    showMessage('Saving your property…', true);

    let newPropertyId = null;

    try {
      const {
        data: { user },
        error: userError
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        window.location.href = 'login.html';
        return;
      }

      const title = document.getElementById('title').value.trim();
      const description =
        document.getElementById('description').value.trim();
      const country = document.getElementById('country').value.trim();
      const city = document.getElementById('city').value.trim();
      const price = Number(document.getElementById('price').value);
      const currency = document.getElementById('currency').value;
      const bedrooms =
        Number(document.getElementById('bedrooms').value) || 0;
      const bathrooms =
        Number(document.getElementById('bathrooms').value) || 0;
      const sqm = Number(document.getElementById('sqm').value) || 0;
      const propertyType =
        document.getElementById('propertyType').value;
      const imageInput = document.getElementById('images');
      const files = Array.from(imageInput.files || []);

      if (!title || !country || !city || !propertyType) {
        throw new Error('Please complete all required fields.');
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Please enter a valid price.');
      }

      if (files.length === 0) {
        throw new Error('Please upload at least one property image.');
      }

      if (files.length > 12) {
        throw new Error('You can upload a maximum of 12 images.');
      }

      const { data: property, error: propertyError } =
        await supabaseClient
          .from('properties')
          .insert({
            agent_id: user.id,
            title,
            description,
            country,
            city,
            price,
            currency,
            bedrooms,
            bathrooms,
            sqm,
            property_type: propertyType,
            status: 'pending'
          })
          .select()
          .single();

      if (propertyError) {
        throw propertyError;
      }

      newPropertyId = property.id;

      submitButton.textContent = 'Uploading images…';

      await uploadPropertyImages({
        files,
        userId: user.id,
        propertyId: property.id
      });

      propertyForm.reset();
      showMessage(
        'Property submitted successfully. It is awaiting approval.',
        true
      );

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error(error);

      if (newPropertyId) {
        await supabaseClient
          .from('properties')
          .delete()
          .eq('id', newPropertyId);
      }

      showMessage(error.message || 'The property could not be saved.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit property';
    }
  });
}
