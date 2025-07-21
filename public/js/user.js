document.addEventListener("DOMContentLoaded", () => {
    console.log('📄 user.js carregado');
    
    const userForm = document.getElementById("user-form");
    const messageDiv = document.getElementById("message");

    // Verificar autenticação
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken"); // ← CORRIGIDO: era "token"
    
    if (!userId || !token) {
        console.error('❌ Usuário não autenticado');
        window.location.href = './login.html';
        return;
    }

    console.log('🔍 Carregando dados do usuário ID:', userId);

    // CORRIGIDO: Carregar dados completos do usuário
    fetch(`/api/users/${userId}`, {
        headers: {
            Authorization: token // ← CORRIGIDO: usa authToken
        }
    })
    .then(response => {
        console.log('📡 Status da resposta:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(user => {
        console.log('✅ Dados recebidos do usuário:', user);
        
        // Preencher todos os campos disponíveis
        if (document.getElementById("name")) {
            document.getElementById("name").value = user.name || '';
        }
        
        if (document.getElementById("email")) {
            document.getElementById("email").value = user.email || '';
        }
        
        // NOVO: Suporte a telefone (se existir no HTML)
        if (document.getElementById("phone")) {
            document.getElementById("phone").value = user.phone || user.telefone || '';
        }
        
        // Atualizar localStorage com dados mais recentes
        localStorage.setItem('userName', user.name || '');
        if (user.email) {
            localStorage.setItem('userEmail', user.email);
        }
        
        console.log('📝 Formulário preenchido com sucesso');
    })
    .catch(error => {
        console.error("❌ Erro ao carregar dados do usuário:", error);
        
        // Fallback: usar dados do localStorage
        const fallbackName = localStorage.getItem('userName');
        const fallbackEmail = localStorage.getItem('userEmail');
        
        if (fallbackName && document.getElementById("name")) {
            document.getElementById("name").value = fallbackName;
            console.log('🔄 Usando nome do localStorage:', fallbackName);
        }
        
        if (fallbackEmail && document.getElementById("email")) {
            document.getElementById("email").value = fallbackEmail;
            console.log('🔄 Usando email do localStorage:', fallbackEmail);
        }
        
        showMessage("Aviso: Erro ao carregar alguns dados. Verifique se as informações estão corretas.", "warning");
    });

    // MELHORADO: Enviar dados atualizados com validações
    if (userForm) {
        userForm.addEventListener("submit", (event) => {
            event.preventDefault();
            console.log('💾 Tentativa de salvar perfil');

            const data = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password") ? 
                         document.getElementById("password").value.trim() || null : null
            };
            
            // NOVO: Incluir telefone se existir
            if (document.getElementById("phone")) {
                data.phone = document.getElementById("phone").value.trim();
            }

            console.log('📊 Dados para enviar:', { ...data, password: data.password ? '[HIDDEN]' : null });

            // Validações básicas
            if (!data.name) {
                showMessage("Nome é obrigatório!", "danger");
                return;
            }

            if (!data.email) {
                showMessage("Email é obrigatório!", "danger");
                return;
            }

            // Verificar se não está enviando email padrão
            if (data.email.includes('exemplo') || data.email === 'usuario@exemplo.com') {
                showMessage("Por favor, insira um email válido!", "warning");
                return;
            }

            // Loading state
            const submitBtn = userForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
                submitBtn.disabled = true;
            }

            fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token // ← CORRIGIDO: usa authToken
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                console.log('📡 Status da resposta de save:', response.status);
                return response.json();
            })
            .then(result => {
                console.log('✅ Resposta do servidor:', result);
                
                if (result.error) {
                    showMessage(result.error, "danger");
                } else {
                    showMessage("Perfil atualizado com sucesso!", "success");
                    
                    // Atualizar localStorage com novos dados
                    localStorage.setItem('userName', data.name);
                    localStorage.setItem('userEmail', data.email);
                    
                    // Tentar atualizar header (sem quebrar se der erro)
                    try {
                        if (window.refreshHeader && typeof window.refreshHeader === 'function') {
                            window.refreshHeader().catch(e => {
                                console.warn('⚠️ Erro ao atualizar header:', e);
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Erro ao chamar refreshHeader:', error);
                    }
                    
                    // Limpar campo de senha após sucesso
                    if (document.getElementById("password")) {
                        document.getElementById("password").value = '';
                    }
                }
            })
            .catch(error => {
                console.error("❌ Erro ao atualizar:", error);
                showMessage("Erro de conexão ao atualizar o perfil.", "danger");
            })
            .finally(() => {
                // Restaurar botão
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText || 'Salvar Alterações';
                    submitBtn.disabled = false;
                }
            });
        });
    }

    // Função auxiliar para mostrar mensagens
    function showMessage(text, type) {
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.className = `alert alert-${type}`;
            messageDiv.classList.remove("d-none");
            
            // Auto-hide após 5 segundos para mensagens de sucesso
            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.classList.add("d-none");
                }, 5000);
            }
        } else {
            // Fallback se não houver messageDiv
            console.log(`${type.toUpperCase()}: ${text}`);
            alert(text);
        }
    }

    // Função de debug (remover em produção)
    window.debugUserProfile = function() {
        console.log('🔍 DEBUG - Estado atual:');
        console.log('UserID:', localStorage.getItem('userId'));
        console.log('AuthToken:', localStorage.getItem('authToken'));
        console.log('UserName:', localStorage.getItem('userName'));
        console.log('UserEmail:', localStorage.getItem('userEmail'));
        console.log('Campo nome:', document.getElementById('name')?.value);
        console.log('Campo email:', document.getElementById('email')?.value);
        console.log('Campo telefone:', document.getElementById('phone')?.value);
    };
    
    console.log('✅ user.js inicializado com sucesso');
});