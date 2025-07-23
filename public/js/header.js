document.addEventListener("DOMContentLoaded", function () {
  fetch("/header.html")
    .then((response) => response.text())
    .then((data) => {
      console.log("Header HTML carregado");
      // Inserir HTML do header
      document.getElementById("header").innerHTML = data;

      // Aguardar um pouco para garantir que o DOM foi processado
      setTimeout(() => {
        // Adaptar conteúdo para biblioteca
        adaptHeaderForLibrary();

        // Verificar login e atualizar interface
        checkLoginStatus();

        // SEMPRE atualizar contador da cesta (independente de login)
        setTimeout(() => {
          updateCartCount();
        }, 200);
      }, 100);
    })
    .catch((error) => {
      console.error("Erro ao carregar header:", error);
    });

  function adaptHeaderForLibrary() {
    console.log("Adaptando header para biblioteca...");

    const links = document.querySelectorAll(
      'a[href="/basket.html"], a[href="/dashboard.html"]'
    );

    links.forEach((link) => {
      if (
        link.textContent.includes("CARRINHO") ||
        link.textContent.includes("MINHAS RESERVAS")
      ) {
        link.href = "/basket.html";
        const innerHTML = link.innerHTML;
        link.innerHTML = innerHTML
          .replace("CARRINHO", "CESTA DE LIVROS")
          .replace("MINHAS RESERVAS", "CESTA DE LIVROS");
        console.log("Link atualizado:", link.href, link.textContent);
      }
    });

    // Garantir que o ID seja cart-count
    const reservationCount = document.getElementById("reservation-count");
    if (reservationCount) {
      reservationCount.id = "cart-count";
      console.log("ID alterado de reservation-count para cart-count");
    }
  }

  function checkLoginStatus() {
    const token = localStorage.getItem("authToken");
    const userName = localStorage.getItem("userName");
    const isAdmin =
      localStorage.getItem("isAdmin") === "true" ||
      localStorage.getItem("isAdmin") === "1";
    const accountLink = document.getElementById("account-link");

    if (token && userName && accountLink) {
      console.log("Usuário logado:", userName);

      // Criar estrutura com nome + botão logout
      const parentLi = accountLink.parentNode;

      // Limpar classes de dropdown se existirem
      parentLi.classList.remove("dropdown");
      parentLi.className = "nav-item ms-2 d-flex align-items-center";

      // Substituir o conteúdo por: ícone + nome clicável + botões
      parentLi.innerHTML = `
                    <!-- Nome do usuário (clicável para dashboard) -->
                    <a href="/dashboard.html" class="user-info d-flex align-items-center text-dark text-decoration-none me-2" 
                       title="Meu Dashboard">
                        <i class="fas fa-user-circle me-2" style="font-size: 1.2rem;"></i>
                        <span class="fw-bold">${userName}</span>
                        ${
                          isAdmin
                            ? '<i class="fas fa-crown text-warning ms-1" title="Administrador"></i>'
                            : ""
                        }
                    </a>
                    
                    <!-- Botões de ação -->
                    <div class="user-actions d-flex align-items-center">
                        <a href="/dashboard.html" class="btn btn-outline-primary btn-sm me-1" title="Minhas Reservas">
                            <i class="fas fa-bookmark"></i>
                        </a>
                        ${
                          isAdmin
                            ? `
                            <a href="/admin-dashboard.html" class="btn btn-outline-secondary btn-sm me-1" title="Painel Admin">
                                <i class="fas fa-cog"></i>
                            </a>
                        `
                            : ""
                        }
                        <button class="btn btn-outline-danger btn-sm" onclick="performLogout()" title="Sair">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                `;

      console.log("Interface de usuário logado criada");
    } else {
      // Usuário não logado
      const accountLink = document.getElementById("account-link");
      if (accountLink) {
        const parentLi = accountLink.parentNode;

        // Restaurar estrutura original
        parentLi.className = "nav-item ms-2";
        parentLi.innerHTML = `
                    <a class="account-btn" href="/login.html" id="account-link">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>ENTRAR</span>
                    </a>
                `;
      }
    }
  }

  // Função de logout simplificada
  function performLogout() {
    console.log("Função performLogout executada");

    if (confirm("Tem certeza que deseja sair?")) {
      console.log("Logout confirmado, limpando dados...");

      // Limpar dados do localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("isAdmin");

      console.log("Dados limpos, redirecionando...");

      // Redirecionar
      window.location.href = "/login.html";
    }
  }

  // Tornar função global
  window.performLogout = performLogout;
});

// Função para atualizar o contador da cesta (VERSÃO SIMPLIFICADA)
function updateCartCount() {
  console.log("updateCartCount() chamada");

  const cart = JSON.parse(localStorage.getItem("bookCart") || "[]");
  const cartCount = cart.length;

  console.log(`Itens na cesta: ${cartCount}`);

  // Buscar elemento contador
  const countElement = document.getElementById("cart-count");

  if (countElement) {
    countElement.textContent = cartCount;
    console.log(`✅ Contador atualizado: cart-count = ${cartCount}`);
  } else {
    console.warn("❌ Elemento cart-count não encontrado!");

    // Tentar encontrar qualquer elemento com classe cart-badge
    const badgeElement = document.querySelector(".cart-badge");
    if (badgeElement) {
      badgeElement.textContent = cartCount;
      console.log(`✅ Contador atualizado via cart-badge = ${cartCount}`);
    } else {
      console.warn("❌ Nenhum elemento contador encontrado!");
    }
  }
}

// Função para ser chamada por outras páginas quando necessário
window.updateCartCount = function () {
  console.log("window.updateCartCount() chamada");

  // Chamar a função local diretamente, sem loop
  const cart = JSON.parse(localStorage.getItem("bookCart") || "[]");
  const cartCount = cart.length;

  console.log(`Itens na cesta (via window): ${cartCount}`);

  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = cartCount;
    console.log(`✅ Contador atualizado via window: cart-count = ${cartCount}`);
  } else {
    console.warn("❌ Elemento cart-count não encontrado via window!");
  }
};

// Escutar mudanças no localStorage para atualizar contador automaticamente
window.addEventListener("storage", function (e) {
  if (e.key === "bookCart") {
    console.log("bookCart mudou no localStorage, atualizando contador...");
    const cart = JSON.parse(e.newValue || "[]");
    const countElement = document.getElementById("cart-count");
    if (countElement) {
      countElement.textContent = cart.length;
      console.log(`✅ Contador atualizado via storage event: ${cart.length}`);
    }
  }
});

// Também escutar mudanças na própria página (quando localStorage é alterado na mesma aba)
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
  const result = originalSetItem.apply(this, [key, value]);
  if (key === "bookCart") {
    console.log("bookCart alterado via setItem, atualizando contador...");
    setTimeout(() => {
      // Chamar função local diretamente
      const cart = JSON.parse(value || "[]");
      const countElement = document.getElementById("cart-count");
      if (countElement) {
        countElement.textContent = cart.length;
        console.log(`✅ Contador atualizado via setItem: ${cart.length}`);
      }
    }, 100);
  }
  return result;
};

// Função para recarregar o header quando o estado de login muda
window.refreshHeader = function () {
  const headerElement = document.getElementById("header");
  if (headerElement) {
    // Recarregar o header
    fetch("/header.html")
      .then((response) => response.text())
      .then((data) => {
        headerElement.innerHTML = data;
        adaptHeaderForLibrary();
        checkLoginStatus();

        // SEMPRE atualizar contador da cesta
        setTimeout(() => {
          updateCartCount();
        }, 200);
      });
  }
};