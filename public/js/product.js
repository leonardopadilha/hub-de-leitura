document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    fetch(`/api/produtos/${productId}`)
        .then(response => response.json())
        .then(product => {
            const productDetails = document.getElementById('product-details');

            productDetails.innerHTML = `
                <div class="col-md-6">
                    <img src="${product.image}" alt="${product.name}" id="product-image" class="img-fluid">
                </div>
                <div class="col-md-6">
                    <h1>${product.name}</h1>
                    <p id="product-description">${product.description}</p>
                    <p id="product-price">Price: R$${product.price.toFixed(2)}</p>
                    <div class="form-group">
                        <label for="product-quantity">Quantidade:</label>
                        <input type="number" id="product-quantity" value="1" min="1" class="form-control w-25">
                    </div>
                    <button class="btn btn-primary mt-2" id="add-to-cart">Add to Cart</button>
                </div>
            `;

            document.getElementById('add-to-cart').addEventListener('click', function() {
                const quantity = document.getElementById('product-quantity').value;
                fetch('/api/carrinho', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: 1, productId: productId, quantity: parseInt(quantity, 10) })
                })
                .then(response => response.json())
                .then(data => {
                    // Mostrar mensagem de sucesso
                    const successContainer = document.getElementById('alert-container');
                    successContainer.className = 'alert alert-success';
                    successContainer.textContent = 'Produto adicionado ao carrinho!';
                    successContainer.style.display = 'block';
                    setTimeout(() => {
                        successContainer.style.display = 'none';
                    }, 3000);
                    // Atualizar o contador do carrinho
                    updateCartCount(1);
                })
                .catch(error => console.error('Erro ao adicionar produto ao carrinho:', error));
            });
        })
        .catch(error => console.error('Erro ao buscar produto:', error));
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
