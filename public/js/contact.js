document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const btn = form.querySelector('button[type="submit"]');
  const alertContainer = document.getElementById('alert-container');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      subject: form.subject.value,
      message: form.message.value.trim()
    };

    // Validação personalizada
    if (!data.name) {
      showError('Por favor, preencha o campo Nome.');
      return;
    }

    if (!data.email) {
      showError('Por favor, preencha o campo E-mail.');
      return;
    }

    if (!data.subject) {
      showError('Por favor, selecione o Assunto.');
      return;
    }

    if (!data.message) {
      showError('Por favor, escreva sua Mensagem.');
      return;
    }

    // Feedback visual
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Enviando…';

    try {
      const res = await fetch('/api/contact', {
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

  function showError(message) {
    alertContainer.className = 'alert alert-danger';
    alertContainer.textContent = message;
    alertContainer.classList.remove('d-none');
    setTimeout(() => alertContainer.classList.add('d-none'), 4000);
  }

  function showSuccess(message) {
    alertContainer.className = 'alert alert-success';
    alertContainer.textContent = message;
    alertContainer.classList.remove('d-none');
    setTimeout(() => alertContainer.classList.add('d-none'), 4000);
  }
});
