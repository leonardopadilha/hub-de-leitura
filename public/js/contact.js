document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      subject: form.subject.value,
      message: form.message.value.trim()
    };

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Enviando…';

    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();

      if (res.ok) {
        showSuccess(body.message || 'Mensagem enviada com sucesso!');
        form.reset();
      } else {
        showError(body.message || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      console.error(err);
      showError('Falha de comunicação com o servidor.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Mensagem';
    }
  });
});

