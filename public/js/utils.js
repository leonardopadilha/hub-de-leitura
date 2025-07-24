(function (window, document) {
  const ALERT_CONTAINER_ID = 'global-alert-container';
  const STYLE_ID = 'global-alert-styles';

  // Injeta CSS de alerta uma única vez (bootstrap precisa estar carregado antes)
  if (!document.getElementById(STYLE_ID)) {
    const css = `
      #${ALERT_CONTAINER_ID} {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1050;
        min-width: 300px;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .alert-warning {
        background-color: #fff3cd !important;
        border-color: #ffe69c !important;
        color: #664d03 !important;
        font-size: 1rem;
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  // Cria container de alertas se não existir
  let alertContainer = document.getElementById(ALERT_CONTAINER_ID);
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = ALERT_CONTAINER_ID;
    alertContainer.className = 'alert d-none';
    document.body.appendChild(alertContainer);
  }

  /**
   * Exibe um alerta genérico
   * @param {string} message - Texto do alerta
   * @param {'success'|'danger'|'warning'|'info'} type - Tipo de alerta (Bootstrap)
   * @param {number} [duration] - Duração em ms (padrão 3000)
   */
  function showAlert(message, type = 'info', duration) {
    const hideAfter = typeof duration === 'number' ? duration : 3000;
    alertContainer.className = `alert alert-${type}`;
    alertContainer.innerHTML = `
      <i class="fas ${
        type === 'success' ? 'fa-check-circle' :
        type === 'danger'  ? 'fa-exclamation-triangle' :
        type === 'warning' ? 'fa-exclamation-circle' :
                             'fa-info-circle'} me-2"></i>
      ${message}
    `;
    alertContainer.classList.remove('d-none');

    setTimeout(() => {
      alertContainer.classList.add('d-none');
    }, hideAfter);
  }

  // Wrappers globais para chamadas simples
  window.showSuccess = function(message, duration) {
    showAlert(message, 'success', duration);
  };
  window.showError = function(message, duration) {
    showAlert(message, 'danger', duration);
  };
  window.showWarning = function(message, duration) {
    showAlert(message, 'warning', duration);
  };
  window.showInfo = function(message, duration) {
    showAlert(message, 'info', duration);
  };

})(window, document);

/* ### Mensagens de Alerta Personalizadas ###
Este script injeta um sistema de alertas reutilizável para toda a aplicação.
Ele substitui os alertas padrão do JavaScript por uma UI mais amigável, utilizando Bootstrap
e Font Awesome.
Para usá-lo, basta incluir `js/utils.js` no seu HTML e chamar `showSuccess('...')` ou `showError('...')` com a mensagem desejada.
Exemplo:
```javascript
showSuccess('Operação realizada com sucesso!');
showError('Ocorreu um erro ao processar sua solicitação.');
```
O script cuida de criar o container de alertas e aplicar os estilos necessários.
Ele também garante que os alertas sejam exibidos de forma consistente em toda a aplicação.
Se você quiser personalizar os estilos, basta editar a variável `STYLE_ID` e o CSS dentro do script.
Os alertas desaparecem automaticamente após 3 segundos, mas você pode ajustar a duração passando um terceiro parâmetro para as funções `showSuccess` e `showError`.
Por exemplo:
```javascript
showSuccess('Mensagem enviada!', 5000); // Dura 5 segundos
showError('Erro ao enviar mensagem', 4000); // Dura 4 segundos
```
Para integrar com formulários ou outras interações, basta chamar essas funções nos locais apropriados.
Se você quiser que os alertas apareçam imediatamente após uma ação, como o envio de um formulário, basta chamar `showSuccess` ou `showError` dentro do callback de sucesso ou erro da sua requisição.
Exemplo:
```javascript
fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
}).then(response => {
  if (response.ok) {
    showSuccess('Dados salvos com sucesso!');
  } else {
    showError('Erro ao salvar dados');
  }
}).catch(err => {
  console.error(err);
  showError('Falha de comunicação com o servidor.');
});
```
*/
