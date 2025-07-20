//import { updateCartCount } from './cart-count.js';
document.addEventListener('DOMContentLoaded', function() {
    fetch('/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            updateCartCount(1); // Supondo userId 1
            checkLoginStatus();
        });

    function checkLoginStatus() {
        const user = sessionStorage.getItem('user');
        const accountLink = document.getElementById('account-link');

        if (user) {
            accountLink.href = '/dashboard.html';
        } else {
            accountLink.href = '/login.html';
        }
    }

    function logout() {
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
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

