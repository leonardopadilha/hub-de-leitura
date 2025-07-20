document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
        document.getElementById('user-name').textContent = user.name;
        fetchUltimoPedido(user.id);
    } else {
        // Redireciona para a página de login se o usuário não estiver autenticado
        window.location.href = '/login.html';
    }

    document.getElementById('logout-button').addEventListener('click', function() {
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    function fetchUltimoPedido(userId) {
        fetch(`/api/ultimo-pedido/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                } else {
                    displayOrderDetails(data);
                }
            })
            .catch(err => showError('Erro ao buscar o último pedido.'));
    }

    function displayOrderDetails(order) {
        document.getElementById('order-id').textContent = order.order_number;
        document.getElementById('order-total').textContent = `R$ ${order.total_price.toFixed(2)}`;
        document.getElementById('order-status').textContent = order.status;
    }

    function showError(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.classList.remove('d-none');
        errorContainer.textContent = message;
    }
});
