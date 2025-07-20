document.addEventListener("DOMContentLoaded", function () {
  const userId = 1; // Supondo um usuário com id 1
  const productList = document.getElementById("product-list");
  const successContainer = document.getElementById("success-container");

  // Limpar o carrinho na inicialização da sessão
  fetch("/api/limpar-carrinho", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data.message))
    .catch((error) => console.error("Erro ao limpar carrinho:", error));

  // Função para mostrar mensagem de sucesso
  function showSuccessMessage(message) {
    successContainer.textContent = message;
    successContainer.classList.remove("d-none");

    // Ocultar mensagem após alguns segundos
    setTimeout(() => {
      successContainer.classList.add("d-none");
    }, 3000);
  }

  // Função para carregar produtos
  function loadProducts() {
    fetch("/api/produtos")
      .then((response) => response.json())
      .then((products) => {
        // Limpar a lista de produtos antes de adicionar novos
        productList.innerHTML = "";

        products.forEach((product) => {
          const productCard = document.createElement("div");
          productCard.className = "product-card col-md-4";
          productCard.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>Price: $${product.price}</p>
            <img src="${product.image}" alt="${product.name}" />
            <label for="quantity-${product.id}">Quantidade:</label>
            <input type="number" id="quantity-${product.id}" value="1" min="1" />
            <button class="add-to-cart" data-id="${product.id}">Comprar</button>
        `;

          productList.appendChild(productCard);
        });

        // Adicionar evento de clique para os botões "Add to Cart"
        document.querySelectorAll(".add-to-cart").forEach((button) => {
          button.addEventListener("click", function () {
            const productId = this.dataset.id;
            const quantity = document.getElementById(
              `quantity-${productId}`
            ).value;

            addToCart(userId, productId, quantity);
          });
        });
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        // Mostrar mensagem de erro no console
        productList.innerHTML =
          '<p class="text-danger">Erro ao carregar produtos.</p>';
      });
  }

  // Função para adicionar ao carrinho
  function addToCart(userId, productId, quantity) {
    fetch("/api/carrinho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        productId: productId,
        quantity: parseInt(quantity, 10),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao adicionar produto ao carrinho");
        }
        return response.json();
      })
      .then((data) => {
        showSuccessMessage("Produto adicionado ao carrinho com sucesso!");
        // Atualizar o contador do carrinho
        updateCartCount(userId);
      })
      .catch((error) =>
        console.error("Erro ao adicionar produto ao carrinho:", error)
      );
  }

  // Função para atualizar o contador do carrinho
  function updateCartCount(userId) {
    fetch(`/api/carrinho/${userId}`)
      .then((response) => response.json())
      .then((cartItems) => {
        const cartCount = cartItems.reduce(
          (total, item) => total + item.quantity,
          0
        );
        document.getElementById("cart-count").textContent = cartCount;
      })
      .catch((error) =>
        console.error("Erro ao atualizar o contador do carrinho:", error)
      );
  }

  // Carregar produtos ao iniciar
  loadProducts();
});
