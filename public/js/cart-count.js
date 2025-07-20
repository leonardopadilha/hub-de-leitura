// Função para atualizar o contador do carrinho
export function updateCartCount(userId) {
    fetch(`/api/carrinho/${userId}`)
        .then(response => response.json())
        .then(cartItems => {
            const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cart-count').textContent = cartCount;
        })
        .catch(error => console.error('Erro ao atualizar o contador do carrinho:', error));
}

// Chama a função quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const userId = 1; // Supondo um usuário com id 1
    updateCartCount(userId);
});
