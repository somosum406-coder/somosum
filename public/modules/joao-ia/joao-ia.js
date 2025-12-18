// ========== MÓDULO JOÃO IA - VERSÃO MODO CLARO FIXO (v4.3 - Tema Claro Fixo Permanentemente) ==========
(function (global, document) {
  "use strict";

  // ========== CONFIGURAÇÕES GLOBAIS - ATUALIZADO PARA NETLIFY ==========
  const REQUEST_ENDPOINT = "/.netlify/functions/gemini-proxy";
  const REQUEST_TIMEOUT = 15001;

  // ========== FUNÇÕES AUXILIARES ==========
  function hideTypingIndicator() {
    const typingIndicator = document.querySelector(".joao-ia-typing");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  function showTypingIndicator() {
    hideTypingIndicator();

    const messagesContainer = document.querySelector(".joao-ia-messages");
    if (!messagesContainer) return null;

    const typingDiv = document.createElement("div");
    typingDiv.className = "joao-ia-typing";
    typingDiv.innerHTML = `
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
        `;

    messagesContainer.appendChild(typingDiv);
    return typingDiv;
  }

  // Função para converter Markdown (Simples) para HTML
  function markdownToHtml(markdown) {
    let html = markdown || "";

    // Títulos (H3, H4, H5, H6)
    html = html.replace(/^###\s*(.*$)/gim, '<h4>$1</h4>'); 
    html = html.replace(/^##\s*(.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#\s*(.*$)/gim, '<h2>$1</h2>');

    // Listas (Não ordenadas)
    html = html.replace(/^\*\s*(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^(<li>.*<\/li>)$/gim, '<ul>$1</ul>');

    // Negrito e Itálico
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Novas Linhas para Parágrafos
    html = html.replace(/\n\s*\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, ''); // Remove parágrafos vazios

    return html;
  }

  function getDataAttr(attr) {
    const script = document.currentScript || document.querySelector('script[src*="joao-ia.js"]');
    return script ? script.getAttribute(`data-${attr}`) : null;
  }

  // ========== LÓGICA PRINCIPAL DO CHAT (MÓDULO JOAOIA) ==========
  const JOAOIA = {
    // ========== CONFIGURAÇÃO PADRÃO ==========
    config: {
      botName: getDataAttr("bot-name") || "João IA",
      initialSuggestions: [
        "Quem foi Zumbi dos Palmares?",
        "Qual é a importância da Lei 10.639?",
        "Fale sobre a Capoeira e suas origens.",
      ],
      storageKey: "joaoIAHistory",
      avatarUrl: getDataAttr("avatar-url") || null,
      proxyUrl: getDataAttr("proxy-url") || REQUEST_ENDPOINT,
    },

    // ========== ESTADO DO CHAT ==========
    isInitialized: false,
    isOpen: false,
    messages: [],
    isSending: false,
    elements: {},

    // ========== RESPOSTAS RÁPIDAS (Fallback e Boas-vindas) ==========
    botResponses: {
      oi: {
        text: `Olá! Eu sou ${getDataAttr("bot-name") || "João IA"}, seu assistente virtual especializado em história e cultura afro-brasileira. Como posso ajudar você hoje?`,
        sender: "bot",
      },
    },

    // ========== FUNÇÕES DE INICIALIZAÇÃO ==========
    init: function () {
      if (this.isInitialized) return;

      this.loadHistory();
      this.renderChatWindow();
      this.addEventListeners();

      if (this.messages.length === 0) {
        this.addMessage(this.botResponses.oi, false);
      }

      this.isInitialized = true;
      console.log(`${this.config.botName} inicializado.`);
    },

    renderChatWindow: function () {
      
        const toggleContent = this.config.avatarUrl
            ? `<img src="${this.config.avatarUrl}" alt="Avatar" />`
            : `<div class="joao-ia-toggle-icon"></div>`;

        const profileContent = this.config.avatarUrl
            ? `<img src="${this.config.avatarUrl}" alt="Avatar" class="joao-ia-avatar-img">`
            : `<div class="joao-ia-avatar-icon"></div>`;


        const container = document.createElement("div");
        container.className = `joao-ia-container joao-ia-position-${getDataAttr("position") || "bottom-right"}`;
        container.innerHTML = `
            <div class="joao-ia-toggle" title="${this.config.botName}">
                ${toggleContent}
            </div>
            <div class="joao-ia-window">
                <div class="joao-ia-header">
                    <div class="joao-ia-header-info">
                        <div class="joao-ia-avatar">
                            ${profileContent}
                        </div>
                        <div class="joao-ia-header-text">
                            <h3>${this.config.botName}</h3>
                            <div class="joao-ia-status">
                                <div class="joao-ia-status-dot"></div>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                    <div class="joao-ia-header-controls">
                        <button class="joao-ia-header-btn joao-ia-clear-history" title="Limpar Histórico">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="joao-ia-header-btn joao-ia-close" title="Fechar Chat">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="joao-ia-messages">
                    </div>
                <div class="joao-ia-suggestions">
                    </div>
                <div class="joao-ia-input-area">
                    <input type="text" class="joao-ia-input" placeholder="Pergunte ao ${this.config.botName}..." />
                    <button class="joao-ia-send" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

      document.body.appendChild(container);

      // Armazena referências para os elementos
      this.elements.container = container;
      this.elements.toggle = container.querySelector(".joao-ia-toggle");
      this.elements.window = container.querySelector(".joao-ia-window");
      this.elements.messages = container.querySelector(".joao-ia-messages");
      this.elements.input = container.querySelector(".joao-ia-input");
      this.elements.sendButton = container.querySelector(".joao-ia-send");
      this.elements.suggestions = container.querySelector(".joao-ia-suggestions");
      this.elements.clearButton = container.querySelector(".joao-ia-clear-history");
      this.elements.closeButton = container.querySelector(".joao-ia-close");
      
      this.renderMessages();
      this.renderSuggestions(this.config.initialSuggestions);
    },

    // ========== FUNÇÕES DE MENSAGEM ==========
    addMessage: function (msg, save = true) {
      if (save) {
        this.messages.push(msg);
        this.saveHistory();
      }

      const messageDiv = document.createElement("div");
      messageDiv.className = `joao-ia-message joao-ia-${msg.sender}`;
      
      // Adicionar conteúdo da mensagem
      const messageContent = document.createElement("div");
      messageContent.className = "joao-ia-message-content";
      messageContent.innerHTML = markdownToHtml(msg.text);
      messageDiv.appendChild(messageContent);
      
      // Adicionar timestamp
      const timestamp = document.createElement("div");
      timestamp.className = "joao-ia-timestamp";
      timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageDiv.appendChild(timestamp);
      
      this.elements.messages.appendChild(messageDiv);
      
      this.scrollToBottom();
    },

    renderMessages: function () {
      this.elements.messages.innerHTML = "";
      this.messages.forEach(msg => this.addMessage(msg, false));
    },

    scrollToBottom: function () {
      const messages = this.elements.messages;
      if (messages) {
        messages.scrollTo({
          top: messages.scrollHeight,
          behavior: 'smooth' 
        });
      }
    },

    // ========== FUNÇÕES DE SUGESTÃO ==========
    renderSuggestions: function (suggestions) {
      this.elements.suggestions.innerHTML = "";
      if (suggestions && suggestions.length > 0) {
        this.elements.suggestions.style.display = "flex";
        suggestions.forEach(suggestion => {
          const chip = document.createElement("span");
          chip.className = "joao-ia-suggestion-chip";
          chip.textContent = suggestion;
          chip.addEventListener("click", () => {
            this.elements.input.value = suggestion;
            this.elements.sendButton.disabled = false;
            this.handleUserSend();
            // Após usar uma sugestão, ela desaparece para dar foco à conversa
            this.elements.suggestions.style.display = "none";
          });
          this.elements.suggestions.appendChild(chip);
        });
      } else {
        this.elements.suggestions.style.display = "none";
      }
    },

    // ========== HANDLERS DE EVENTOS E LÓGICA DE ENVIO ==========
    handleUserSend: function () {
      const prompt = this.elements.input.value.trim();
      if (prompt === "" || this.isSending) return;

      this.isSending = true;
      this.elements.sendButton.disabled = true;
      this.elements.input.disabled = true;
      this.elements.suggestions.style.display = "none";

      this.addMessage({ text: prompt, sender: "user" });
      this.elements.input.value = "";
      
      const typingIndicator = showTypingIndicator();

      this.fetchGeminiResponse(prompt)
        .then(response => {
            // Remove o indicador de digitação antes de adicionar a mensagem
            if (typingIndicator) typingIndicator.remove(); 
            this.addMessage({ text: response, sender: "bot" });
        })
        .catch(error => {
            console.error("Erro ao comunicar com o Gemini:", error);
            if (typingIndicator) typingIndicator.remove(); 
            this.addMessage({
                text: "❌ Ops! Houve um erro ao obter a resposta da IA. Por favor, tente novamente em instantes.",
                sender: "bot"
            });
        })
        .finally(() => {
            this.isSending = false;
            this.elements.input.disabled = false;
            // Reabilita o botão se houver texto
            if (this.elements.input.value.trim() !== "") {
                this.elements.sendButton.disabled = false;
            }
            this.elements.input.focus();
        });
    },

    fetchGeminiResponse: async function (prompt) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(this.config.proxyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 408 || (response.status === 504 && response.statusText === "Gateway Timeout")) {
             throw new Error("[TIMEOUT]");
        }
        
        if (!response.ok) {
          throw new Error(`Erro de rede: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === "success" && data.resposta) {
             return data.resposta;
        }

        if (data.status === "error") {
            console.error("Erro da API no proxy:", data.resposta);
            return "Desculpe, houve um erro ao processar sua solicitação no servidor. Por favor, reformule a pergunta ou tente mais tarde.";
        }

        throw new Error("Resposta da API em formato inesperado.");

      } catch (error) {
        if (error.message.includes("[TIMEOUT]") || error.name === 'AbortError') {
             console.warn("Requisição abortada: Timeout.");
             return "[TIMEOUT] Desculpe, a IA demorou muito para responder. Tente novamente ou simplifique a pergunta.";
        }
        console.error("Erro na comunicação com a API:", error.message);
        return "Desculpe, a IA está indisponível. Tente novamente em instantes. Enquanto isso, posso ajudar com os módulos da plataforma (Módulo Educador, Biblioteca, etc).";
      }
    },

    // ========== PERSISTÊNCIA E EVENTOS ==========
    loadHistory: function () {
      try {
        const history = localStorage.getItem(this.config.storageKey);
        if (history) {
          this.messages = JSON.parse(history);
        }
      } catch (error) {
        console.warn("Erro ao carregar histórico:", error);
        this.messages = [];
      }
    },

    saveHistory: function () {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.messages));
      } catch (error) {
        console.warn("Erro ao salvar histórico:", error);
      }
    },

    addEventListeners: function () {
      this.elements.toggle.addEventListener("click", () => {
        this.isOpen = !this.isOpen;
        this.elements.container.classList.toggle("joao-ia-open", this.isOpen);
        if (this.isOpen) {
            this.elements.input.focus();
            this.scrollToBottom();
        }
      });

      this.elements.input.addEventListener("input", (e) => {
        this.elements.sendButton.disabled = e.target.value.trim() === "";
      });

      this.elements.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !this.elements.sendButton.disabled) {
          this.handleUserSend();
        }
      });

      this.elements.sendButton.addEventListener("click", () => {
        this.handleUserSend();
      });

      this.elements.clearButton.addEventListener("click", () => {
        this.clearHistory();
      });

      this.elements.closeButton.addEventListener("click", () => {
        this.isOpen = false;
        this.elements.container.classList.remove("joao-ia-open");
      });
    },

    clearHistory: function () {
      if (
        !confirm("Tem certeza que deseja limpar todo o histórico de conversas?")
      ) {
        return;
      }

      this.messages = [];
      this.elements.messages.innerHTML = "";

      try {
        localStorage.removeItem(this.config.storageKey);
      } catch (error) {
        console.warn("Erro ao limpar histórico:", error);
      }

      this.addMessage(this.botResponses.oi, false);

      if (this.elements.suggestions) {
        this.elements.suggestions.style.display = "flex";
        this.renderSuggestions(this.config.initialSuggestions);
      }

      alert("Histórico limpo com sucesso!");
    },

    // ========== API PÚBLICA ==========
    destroy: function () {
      if (this.elements.container?.parentNode) {
        this.elements.container.parentNode.removeChild(this.elements.container);
      }

      this.isInitialized = false;
      this.isOpen = false;
      this.messages = [];

      console.log("João IA destruído");
    },

    updateConfig: function (newConfig) {
      Object.assign(this.config, newConfig);
    },
  };

  // ========== INICIALIZAÇÃO AUTOMÁTICA ==========
  if (getDataAttr("auto-init") !== "false") {
    document.addEventListener("DOMContentLoaded", () => {
      JOAOIA.init();
      global.JOAOIA = JOAOIA; // Torna o módulo acessível globalmente
    });
  } else {
    global.JOAOIA = JOAOIA;
  }
})(window, document);