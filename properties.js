console.log("Kosmos properties.js is running");

const propertyContainer = document.getElementById("property-container");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(price, currency = "EUR") {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price on request";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(numericPrice);
  } catch {
    return `${currency} ${numericPrice.toLocaleString("en-US")}`;
  }
}

function renderError(message) {
  if (!propertyContainer) return;

  propertyContainer.innerHTML = `
    <div class="md:col-span-2 lg:col-span-3 border border-red-200 bg-red-50 p-6">
      <p class="font-medium text-red-700">Properties could not be loaded.</p>
      <p class="mt-2 text-sm text-red-600">${escapeHtml(message)}</p>
    </div>
  `;
}

function renderEmptyState() {
  if (!propertyContainer) return;

  propertyContainer.innerHTML = `
    <div class="md:col-span-2 lg:col-span-3 border border-gold/20 p-8 text-center">
      <p class="font-serif text-2xl text-ink">New properties coming soon</p>
      <p class="mt-2 text-sm text-muted">
        Approved listings will appear here automatically.
      </p>
    </div>
  `;
}

function renderProperties(properties) {
  if (!propertyContainer) return;

  propertyContainer.innerHTML = properties
    .map((property) => {
      const image =
        property.property_images?.[0]?.image_url ||
        "https://placehold.co/900x600?text=Kosmos+Property";

      return `
        <article class="group border border-gold/20 bg-white overflow-hidden hover:border-gold transition-all duration-300">
          <div class="aspect-[4/3] overflow-hidden bg-paper">
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(property.title)}"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            >
          </div>

          <div class="p-6">
            <p class="text-[0.65rem] tracking-widest uppercase text-gold mb-2">
              ${escapeHtml(property.city)}, ${escapeHtml(property.country)}
            </p>

            <h3 class="font-serif text-2xl font-light text-ink">
              ${escapeHtml(property.title)}
            </h3>

            <p class="mt-3 text-sm text-muted">
              ${formatPrice(property.price, property.currency)}
            </p>

            <div class="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gold/15 text-xs text-muted">
              <span>${Number(property.bedrooms) || 0} bedrooms</span>
              <span>${Number(property.bathrooms) || 0} bathrooms</span>
              <span>${Number(property.sqm) || 0} m²</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProperties() {
  if (!propertyContainer) return;

  if (typeof supabaseClient === "undefined") {
    renderError("Supabase has not been initialized.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("properties")
      .select(`
        id,
        title,
        country,
        city,
        price,
        currency,
        bedrooms,
        bathrooms,
        sqm,
        property_type,
        created_at,
        property_images (
          image_url,
          sort_order
        )
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      renderEmptyState();
      return;
    }

    const normalizedProperties = data.map((property) => ({
      ...property,
      property_images: [...(property.property_images || [])].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      )
    }));

    renderProperties(normalizedProperties);
  } catch (error) {
    console.error("Property loading error:", error);
    renderError(error.message || "An unexpected error occurred.");
  }
}

document.addEventListener("DOMContentLoaded", loadProperties);
