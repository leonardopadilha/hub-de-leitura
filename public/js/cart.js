document.addEventListener('DOMContentLoaded', function() {
    const userId = 1; // Supondo um usuário com id 1
    const shippingFee = 19.90; // Valor fixo do frete

    loadCart(userId);

    // Função para carregar o carrinho
    function loadCart(userId) {
        fetch(`/api/carrinho/${userId}`)
            .then(response => response.json())
            .then(cartItems => {
                const cartList = document.getElementById('cart-list');
                const totalProductsElement = document.getElementById('total-products');
                const shippingFeeElement = document.getElementById('shipping-fee');
                const totalWithShippingElement = document.getElementById('total-with-shipping');
                const totalsContainer = document.getElementById('totals');

                // Limpar a lista de produtos antes de adicionar novos
                cartList.innerHTML = '';

                if (cartItems.length === 0) {
                    // Exibir mensagem de carrinho vazio e botão para voltar à home
                    cartList.innerHTML = `
                        <div class="text-center">
                            <p>Seu carrinho está vazio.</p>
                            <a href="/" class="btn btn-primary">Voltar para Home</a>
                        </div>
                    `;
                    totalsContainer.classList.add('d-none'); // Ocultar o total e botão de pagamento
                } else {
                    let totalProducts = 0;
                    totalsContainer.classList.remove('d-none'); // Mostrar o total e botão de pagamento

                    cartItems.forEach(item => {
                        const cartItem = document.createElement('div');
                        cartItem.className = 'cart-item mb-4';
                        cartItem.innerHTML = `
                            <legend>${item.name}</legend>
                            <p>Preço: R$${(item.price).toFixed(2)}</p>
                            <p>Quantidade: ${item.quantity}</p>
                            <p>Total: R$${(item.price * item.quantity).toFixed(2)}</p>
                            <button class="btn btn-danger remove-from-cart" data-product-id="${item.productId}">Remover</button>
                        `;
                        cartList.appendChild(cartItem);

                        // Acumular o total dos produtos
                        totalProducts += item.price * item.quantity;
                    });

                    // Atualizar os totais no DOM
                    totalProductsElement.innerHTML = `Valor total do(s) Produto(s): R$${totalProducts.toFixed(2)}`;
                    shippingFeeElement.innerHTML = `Frete: R$${shippingFee.toFixed(2)}`;
                    totalWithShippingElement.innerHTML = `Valor total + Frete fixo: R$${(totalProducts + shippingFee).toFixed(2)}`;

                    // Adicionar evento de clique para os botões "Remover"
                    document.querySelectorAll('.remove-from-cart').forEach(button => {
                        button.addEventListener('click', function() {
                            const productId = this.dataset.productId;
                            console.log('Removendo produto com ID:', productId); // Para depuração

                            fetch(`/api/carrinho/${userId}/${productId}`, {
                                method: 'DELETE',
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Erro ao remover produto');
                                }
                                return response.json();
                            })
                            .then(data => {
                                // Atualizar a lista de produtos no carrinho sem recarregar a página
                                loadCart(userId);
                                // Exibir mensagem de sucesso
                                showAlert('Produto removido do carrinho!', 'success');
                            })
                            .catch(error => {
                                console.error('Erro ao remover produto do carrinho:', error);
                                // Exibir mensagem de erro
                                showAlert('Erro ao remover produto do carrinho!', 'danger');
                            });
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao buscar produtos no carrinho:', error);
                showAlert('Erro ao buscar produtos no carrinho!', 'danger');
            });
    }

    // Função para exibir alertas
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        alertContainer.className = `alert alert-${type}`;
        alertContainer.textContent = message;
        alertContainer.classList.remove('d-none');
        setTimeout(() => {
            alertContainer.classList.add('d-none');
        }, 3000);
    }
});

// Função para atualizar o contador do carrinho
function updateCartCount(userId) {
    fetch(`/api/carrinho/${userId}`)
        .then(response => response.json())
        .then(cartItems => {
            const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cart-count').textContent = cartCount;
        })
        .catch(error => console.error('Erro ao atualizar o contador do carrinho:', error));
}
