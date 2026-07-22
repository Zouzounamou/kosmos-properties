const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

function showMessage(text, ok = false) {
  if (!message) return;
  message.textContent = text;
  message.className = ok ? 'text-sm text-green-700' : 'text-sm text-red-700';
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('Creating your account…', true);
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const country = document.getElementById('country').value.trim();
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName, country, role: 'agent' },
        emailRedirectTo: `${window.location.origin}/login.html`
      }
    });
    if (error) return showMessage(error.message);
    showMessage('Account created. Check your email to confirm your address.', true);
    registerForm.reset();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('Signing in…', true);
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return showMessage(error.message);
    window.location.href = 'dashboard.html';
  });
}
