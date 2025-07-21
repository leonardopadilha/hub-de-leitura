document.addEventListener("DOMContentLoaded", function () {
  fetch("/header.html")
    .then((response) => response.text())
    .then((data) => {
      console.log("Header HTML carregado"); // Debug
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

        // Se logado, também verificar reservas ativas
        const userId = localStorage.getItem("userId");
        if (userId) {
          updateReservationCount(userId);
        }
      }, 100);
    })
    .catch((error) => {
      console.error("Erro ao carregar header:", error);
    });

  function adaptHeaderForLibrary() {
    console.log("Adaptando header para biblioteca..."); // Debug

    // 
    const links = document.querySelectorAll(
      'a[href="/basket.html"], a[href="/dashboard.html"]'
    );

    links.forEach((link) => {
      if (
        link.textContent.includes("CARRINHO") ||
        link.textContent.includes("MINHAS RESERVAS")
      ) {
        link.href = "/cart.html";
        const innerHTML = link.innerHTML;
        link.innerHTML = innerHTML
          .replace("CARRINHO", "CESTA DE LIVROS")
          .replace("MINHAS RESERVAS", "CESTA DE LIVROS");
        console.log("Link atualizado:", link.href, link.textContent); // Debug
      }
    });

    // Garantir que o ID seja cart-count
    const reservationCount = document.getElementById("reservation-count");
    if (reservationCount) {
      reservationCount.id = "cart-count";
      console.log("ID alterado de reservation-count para cart-count"); // Debug
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
      console.log("Usuário logado:", userName); // Debug

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

      console.log("Interface de usuário logado criada"); // Debug
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
    console.log("Função performLogout executada"); // Debug

    if (confirm("Tem certeza que deseja sair?")) {
      console.log("Logout confirmado, limpando dados..."); // Debug

      // Limpar dados do localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("isAdmin");

      console.log("Dados limpos, redirecionando..."); // Debug

      // Redirecionar
      window.location.href = "/login.html";
    }
  }

  // Tornar função global
  window.performLogout = performLogout;
});

// Função para atualizar o contador da cesta (VERSÃO SIMPLIFICADA)
function updateCartCount() {
  console.log("updateCartCount() chamada"); // Debug

  const cart = JSON.parse(localStorage.getItem("bookCart") || "[]");
  const cartCount = cart.length;

  console.log(`Itens na cesta: ${cartCount}`); // Debug

  // Buscar elemento contador
  const countElement = document.getElementById("cart-count");

  if (countElement) {
    countElement.textContent = cartCount;
    console.log(`✅ Contador atualizado: cart-count = ${cartCount}`); // Debug
  } else {
    console.warn("❌ Elemento cart-count não encontrado!"); // Debug

    // Tentar encontrar qualquer elemento com classe cart-badge
    const badgeElement = document.querySelector(".cart-badge");
    if (badgeElement) {
      badgeElement.textContent = cartCount;
      console.log(`✅ Contador atualizado via cart-badge = ${cartCount}`); // Debug
    } else {
      console.warn("❌ Nenhum elemento contador encontrado!"); // Debug
    }
  }
}

// Função legacy para compatibilidade
function updateReservationCount(userId) {
  // Se estiver logado, pode também mostrar reservas ativas no botão do usuário
  const token = localStorage.getItem("authToken");

  if (!token) {
    return; // Se não estiver logado, só mostra cesta
  }

  fetch("/api/reservations", {
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao buscar reservas");
      }
      return response.json();
    })
    .then((reservations) => {
      // Contar apenas reservas ativas
      const activeReservations = reservations.filter(
        (r) => r.status === "active"
      );
      const count = activeReservations.length;

      // Verificar se há reservas vencendo em breve
      checkUpcomingDeadlines(activeReservations);
    })
    .catch((error) => {
      console.error("Erro ao atualizar contador de reservas:", error);
    });
}

function checkUpcomingDeadlines(reservations) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const urgentReservations = reservations.filter((reservation) => {
    if (!reservation.pickup_deadline) return false;
    const deadline = new Date(reservation.pickup_deadline);
    return deadline <= tomorrow && deadline > now;
  });

  if (urgentReservations.length > 0) {
    // Mostrar notificação discreta
    showReservationAlert(urgentReservations.length);
  }
}

function showReservationAlert(count) {
  // Verificar se já foi mostrado nesta sessão
  const alertShown = sessionStorage.getItem("urgentReservationAlertShown");
  if (alertShown) return;

  const message =
    count === 1
      ? "Você tem 1 reserva vencendo em breve!"
      : `Você tem ${count} reservas vencendo em breve!`;

  // Mostrar alerta discreto (pode personalizar como preferir)
  setTimeout(() => {
    if (confirm(message + "\n\nDeseja ver suas reservas agora?")) {
      window.location.href = "/dashboard.html";
    }
  }, 2000);

  // Marcar como mostrado nesta sessão
  sessionStorage.setItem("urgentReservationAlertShown", "true");
}

// Função para ser chamada por outras páginas quando necessário
window.updateCartCount = function () {
  console.log("window.updateCartCount() chamada"); // Debug

  // Chamar a função local diretamente, sem loop
  const cart = JSON.parse(localStorage.getItem("bookCart") || "[]");
  const cartCount = cart.length;

  console.log(`Itens na cesta (via window): ${cartCount}`); // Debug

  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = cartCount;
    console.log(`✅ Contador atualizado via window: cart-count = ${cartCount}`); // Debug
  } else {
    console.warn("❌ Elemento cart-count não encontrado via window!"); // Debug
  }
};

window.updateReservationCount = function () {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  if (!userId || !token) {
    console.log("Usuário não logado, não atualizando reservas");
    return;
  }

  // Fazer a chamada real para a API
  fetch("/api/reservations", {
    headers: { Authorization: token },
  })
    .then((response) => response.json())
    .then((reservations) => {
      const activeReservations = reservations.filter(
        (r) => r.status === "active"
      ).length;

      // Atualizar badge de reservas no header
      const badge = document.getElementById("reservations-count");
      if (badge) {
        badge.textContent = activeReservations;
        badge.style.display = activeReservations > 0 ? "inline" : "none";
      }

      console.log(`Reservas atualizadas: ${activeReservations}`);
    })
    .catch((error) => {
      console.error("Erro ao buscar reservas:", error);
    });
};

// Escutar mudanças no localStorage para atualizar contador automaticamente
window.addEventListener("storage", function (e) {
  if (e.key === "bookCart") {
    console.log("bookCart mudou no localStorage, atualizando contador..."); // Debug
    const cart = JSON.parse(e.newValue || "[]");
    const countElement = document.getElementById("cart-count");
    if (countElement) {
      countElement.textContent = cart.length;
      console.log(`✅ Contador atualizado via storage event: ${cart.length}`); // Debug
    }
  }
});

// Também escutar mudanças na própria página (quando localStorage é alterado na mesma aba)
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
  const result = originalSetItem.apply(this, [key, value]);
  if (key === "bookCart") {
    console.log("bookCart alterado via setItem, atualizando contador..."); // Debug
    setTimeout(() => {
      // Chamar função local diretamente
      const cart = JSON.parse(value || "[]");
      const countElement = document.getElementById("cart-count");
      if (countElement) {
        countElement.textContent = cart.length;
        console.log(`✅ Contador atualizado via setItem: ${cart.length}`); // Debug
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
