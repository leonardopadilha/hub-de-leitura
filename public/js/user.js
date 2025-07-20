document.addEventListener("DOMContentLoaded", () => {
    const userForm = document.getElementById("user-form");
    const messageDiv = document.getElementById("message");

    // Preencher o formulário com dados do usuário (opcional)
    fetch(`/api/users/${localStorage.getItem("userId")}`, {
        headers: {
            Authorization: localStorage.getItem("token")
        }
    })
        .then(response => response.json())
        .then(user => {
            document.getElementById("name").value = user.name;
            document.getElementById("email").value = user.email;
        })
        .catch(error => console.error("Erro ao carregar dados do usuário:", error));

    // Enviar os dados atualizados
    userForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userId = localStorage.getItem("userId"); // Obter o ID do usuário logado
        const token = localStorage.getItem("token");

        const data = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value || null
        };

        fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    messageDiv.textContent = data.error;
                    messageDiv.className = "alert alert-danger";
                } else {
                    messageDiv.textContent = "Usuário atualizado com sucesso!";
                    messageDiv.className = "alert alert-success";
                }
                messageDiv.classList.remove("d-none");
            })
            .catch(error => {
                messageDiv.textContent = "Erro ao atualizar o usuário.";
                messageDiv.className = "alert alert-danger";
                messageDiv.classList.remove("d-none");
            });
    });
});


