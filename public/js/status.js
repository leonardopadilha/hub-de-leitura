document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (!orderId) {
        document.getElementById('status-section').innerHTML = 'ID do pedido não encontrado.';
        return;
    }

    fetch(`/api/orders/${orderId}`)
        .then(response => response.json())
        .then(order => {
            const statusSection = document.getElementById('status-section');
            statusSection.innerHTML = `
                <h3>Status do Pedido</h3>
                <p>ID do Pedido: ${order.id}</p>
                <p>Status: ${order.status}</p>
                <p>Total: $${order.total_price}</p>
            `;
        })
        .catch(error => console.error('Erro ao buscar status do pedido:', error));
});
