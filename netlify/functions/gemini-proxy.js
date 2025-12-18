// netlify/functions/gemini-proxy.js
// VERSÃO 4.7: CORREÇÃO CRÍTICA DO PAYLOAD: Remove o campo 'config' inválido para a API REST.

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - SISTEMA ATIVO (v4.7 - API Final) ===");
    
    // Configurações da API Gemini
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Timeout para a requisição Gemini (15 segundos)
    const REQUEST_TIMEOUT = 15000; 

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) };

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        console.log("📝 Pergunta:", prompt);

        if (!prompt || prompt.trim() === '') {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ status: "error", resposta: "A requisição está vazia." }) 
            };
        }
        
        // 1. Definição da Instrução do Sistema (Personality)
        const systemInstruction = `Você é o "João IA", um assistente digital focado em história, cultura e temas afro-brasileiros. Seu objetivo é apoiar estudantes, educadores e a comunidade do projeto "Somos Um". Responda de forma informativa e inspiradora, mantendo a personalidade de um mentor sábio e acolhedor. Sempre que possível, utilize uma linguagem que valorize a cultura e a história africana e afro-brasileira.`;
        
        // 2. Construção do Payload - CORRIGIDO (Remove 'config' e usa 'systemInstruction' no 'content')
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: systemInstruction },
                        { text: prompt }
                    ]
                }
            ],
            // 'config' REMOVIDO
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        // 3. Execução com Timeout
        const fetchPromise = fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request Timeout")), REQUEST_TIMEOUT)
        );

        const fetchResponse = await Promise.race([fetchPromise, timeoutPromise]);

        // 4. Tratamento da Resposta
        if (fetchResponse.statusText === "Request Timeout") {
            console.error("⏳ Timeout da Requisição.");
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "[TIMEOUT] Desculpe, a IA demorou muito para responder. Tente novamente ou simplifique a pergunta."
                })
            };
        }

        if (!fetchResponse.ok) {
            const apiData = await fetchResponse.json().catch(() => ({}));
            console.error("❌ Falha na API Gemini:", apiData.error ? (apiData.error.message || fetchResponse.statusText) : fetchResponse.statusText);
            
            // Retorna o fallback padrão em caso de falha da API
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Desculpe, a IA está indisponível. Tente novamente em instantes. Enquanto isso, posso ajudar com os módulos da plataforma (Módulo Educador, Biblioteca, etc)."
                })
            };
        }

        // 5. Extração da Resposta
        const apiData = await fetchResponse.json();
        const iaResposta = apiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Não foi possível extrair a resposta da IA.";

        console.log("✅ Resposta Gemini:", iaResposta.substring(0, 100) + "...");

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: "success",
                resposta: iaResposta 
            })
        };

    } catch (error) {
        // Erro genérico na execução da função (ex: JSON mal formatado ou erro de rede)
        console.error("💥 Erro capturado na função:", error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Desculpe, houve um erro interno do servidor. Tente novamente." 
            })
        };
    }
};