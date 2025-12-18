# 🤖 João IA - Assistente Virtual com Gemini

## ✨ Visão Geral

O **João IA** é um módulo de chatbot inteligente e reutilizável, desenvolvido para ser facilmente integrado em plataformas educacionais, como o projeto "Somos Um".

Ele utiliza o modelo **Gemini 2.5 Flash** da Google para fornecer respostas dinâmicas, com um contexto especializado em história e cultura afro-brasileira (conforme configurado em `manifest.json`).

## 📁 Estrutura do Módulo

O módulo é composto por estes arquivos essenciais, que devem ser mantidos na mesma pasta:

projeto/
└── modules/
    └── joao-ia/
        ├── joao-ia.js        # Lógica principal e integração com a API Gemini
        ├── joao-ia.css       # Estilização completa do chatbot
        ├── manifest.json     # Configurações padrão do módulo
        ├── README.md         # Documentação do módulo
        └── assets/
            └── images/
                ├── joao-avatar.png
                ├── joao-avatar.jpg
                └── joao-avatar.webp
