// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const apiKeyInput = document.getElementById('apiKey');
const explanationLangSelect = document.getElementById('explanationLang');
const sessionInfo = document.getElementById('sessionInfo');

// State
let conversationHistory = [];
let learningData = {
    sessions: [],
    vocabulary: [],
    topics: [],
    totalMessages: 0,
    startDate: new Date().toISOString(),
    lastSession: null
};

// Initialize app
function initApp() {
    loadApiKey();
    loadExplanationLanguage();
    loadLearningData();
    setupEventListeners();
    showWelcomeMessage();
    updateSessionInfo();
}

// Load saved data
function loadApiKey() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}

function loadExplanationLanguage() {
    const savedLang = localStorage.getItem('explanationLang');
    if (savedLang) {
        explanationLangSelect.value = savedLang;
        document.getElementById('currentLang').textContent = savedLang;
    } else {
        document.getElementById('currentLang').textContent = explanationLangSelect.value;
    }
}

function loadLearningData() {
    const saved = localStorage.getItem('dutchLearningData');
    if (saved) {
        learningData = JSON.parse(saved);
    }
}

// Save functions
function saveApiKey() {
    localStorage.setItem('geminiApiKey', apiKeyInput.value);
}

function saveExplanationLanguage() {
    localStorage.setItem('explanationLang', explanationLangSelect.value);
    document.getElementById('currentLang').textContent = explanationLangSelect.value;
}

function saveLearningData() {
    localStorage.setItem('dutchLearningData', JSON.stringify(learningData));
}

// Event listeners
function setupEventListeners() {
    apiKeyInput.addEventListener('input', saveApiKey);
    apiKeyInput.addEventListener('blur', saveApiKey);
    apiKeyInput.addEventListener('change', saveApiKey);
    
    explanationLangSelect.addEventListener('change', () => {
        saveExplanationLanguage();
        conversationHistory = [];
        chatContainer.innerHTML = '';
        showWelcomeMessage();
    });
}

// Update session info
function updateSessionInfo() {
    const sessions = learningData.sessions.length;
    const lastSession = learningData.lastSession 
        ? new Date(learningData.lastSession).toLocaleDateString() 
        : 'Never';
    
    if (sessions > 0) {
        const lang = explanationLangSelect.value;
        if (lang === 'Spanish') {
            sessionInfo.textContent = `Sesiones: ${sessions} | Última visita: ${lastSession}`;
        } else {
            sessionInfo.textContent = `Sessions: ${sessions} | Last visit: ${lastSession}`;
        }
    }
}

// Create learning context for AI
function getLearningContext() {
    const lang = explanationLangSelect.value;
    
    if (learningData.sessions.length === 0) {
        return lang === 'Spanish' 
            ? 'Este es un estudiante completamente nuevo. No tiene historial de aprendizaje previo.'
            : 'This is a completely new student. No previous learning history.';
    }
    
    const recentTopics = learningData.topics.slice(-5);
    const recentVocab = learningData.vocabulary.slice(-10);
    const sessionCount = learningData.sessions.length;
    
    if (lang === 'Spanish') {
        let context = `CONTEXTO DEL ESTUDIANTE:\n`;
        context += `- Ha tenido ${sessionCount} sesiones de aprendizaje\n`;
        context += `- Última sesión: ${new Date(learningData.lastSession).toLocaleDateString()}\n`;
        
        if (recentTopics.length > 0) {
            context += `- Temas estudiados recientemente: ${recentTopics.join(', ')}\n`;
        }
        
        if (recentVocab.length > 0) {
            context += `- Vocabulario aprendido recientemente: ${recentVocab.join(', ')}\n`;
        }
        
        context += `\nUSA ESTE CONTEXTO para personalizar tu enseñanza. Pregunta si quiere revisar temas anteriores o aprender algo nuevo.`;
        return context;
    } else {
        let context = `STUDENT CONTEXT:\n`;
        context += `- Has had ${sessionCount} learning sessions\n`;
        context += `- Last session: ${new Date(learningData.lastSession).toLocaleDateString()}\n`;
        
        if (recentTopics.length > 0) {
            context += `- Recently studied topics: ${recentTopics.join(', ')}\n`;
        }
        
        if (recentVocab.length > 0) {
            context += `- Recently learned vocabulary: ${recentVocab.join(', ')}\n`;
        }
        
        context += `\nUSE THIS CONTEXT to personalize your teaching. Ask if they want to review previous topics or learn something new.`;
        return context;
    }
}

// Extract learning data from conversation
function extractLearningData(userMessage, assistantMessage) {
    // Extract potential vocabulary (Dutch words in assistant's message)
    const dutchWords = assistantMessage.match(/\b[A-Za-zÀ-ÿ]+\b/g);
    if (dutchWords) {
        dutchWords.forEach(word => {
            if (word.length > 2 && !learningData.vocabulary.includes(word)) {
                learningData.vocabulary.push(word);
            }
        });
        // Keep only last 100 vocabulary items
        if (learningData.vocabulary.length > 100) {
            learningData.vocabulary = learningData.vocabulary.slice(-100);
        }
    }
    
    // Extract topics from user messages
    const topicKeywords = [
        'greeting', 'saludos', 'numbers', 'números', 'grammar', 'gramática',
        'travel', 'viaje', 'pronunciation', 'pronunciación', 'conversation',
        'conversación', 'verb', 'verbo', 'noun', 'sustantivo', 'food', 'comida',
        'family', 'familia', 'time', 'tiempo', 'weather', 'clima', 'colors', 'colores'
    ];
    
    const userLower = userMessage.toLowerCase();
    topicKeywords.forEach(keyword => {
        if (userLower.includes(keyword)) {
            if (!learningData.topics.includes(keyword)) {
                learningData.topics.push(keyword);
            }
        }
    });
}

// Welcome message
function getWelcomeMessage() {
    const lang = explanationLangSelect.value;
    const isReturning = learningData.sessions.length > 0;
    
    if (lang === 'Spanish') {
        if (isReturning) {
            const lastDate = new Date(learningData.lastSession).toLocaleDateString();
            return `¡Bienvenido de vuelta! 🎉\n\nTu última sesión fue el ${lastDate}. He revisado tu historial de aprendizaje y sé en qué temas has estado trabajando.\n\n¿Quieres repasar lo que aprendiste antes o prefieres aprender algo nuevo?`;
        }
        return '¡Hola! Soy tu profesor de holandés. Te enseñaré Nederlands y explicaré todo en español. ¿Qué te gustaría aprender hoy?';
    } else {
        if (isReturning) {
            const lastDate = new Date(learningData.lastSession).toLocaleDateString();
            return `Welcome back! 🎉\n\nYour last session was on ${lastDate}. I've reviewed your learning history and know what topics you've been working on.\n\nWould you like to review what you learned before, or learn something new?`;
        }
        return 'Hello! I\'m your Dutch teacher. I\'ll teach you Nederlands and explain everything in English. What would you like to learn today?';
    }
}

function showWelcomeMessage() {
    addMessage('assistant', getWelcomeMessage());
}

// Message functions
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    chatContainer.appendChild(errorDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.id = 'loading';
    const lang = explanationLangSelect.value;
    loadingDiv.textContent = lang === 'Spanish' ? '💭 El profesor está pensando...' : '💭 Teacher is thinking...';
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Send message
async function sendMessage() {
    const message = userInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const explanationLang = explanationLangSelect.value;
    
    if (!message) return;
    
    if (!apiKey) {
        const errorMsg = explanationLang === 'Spanish' 
            ? 'Por favor, ingresa tu API key de Gemini primero!'
            : 'Please enter your Gemini API key first!';
        showError(errorMsg);
        return;
    }
    
    addMessage('user', message);
    userInput.value = '';
    sendBtn.disabled = true;
    showLoading();
    
    try {
        const learningContext = getLearningContext();
        const systemPrompt = explanationLang === 'Spanish'
            ? `Eres un profesor experto de holandés (Nederlands). Tu rol es:
- Enseñar holandés de manera clara y atractiva
- Dar TODAS las explicaciones en ESPAÑOL
- Enseñar palabras y frases en holandés, pero explicar en español
- Proporcionar ejemplos y explicaciones claras
- Corregir errores de manera amable y constructiva
- Adaptarte al nivel del estudiante
- Hacer que el aprendizaje sea divertido e interactivo
- Usar lenguaje simple al explicar conceptos complejos
- Proporcionar consejos de pronunciación cuando sea relevante
- Siempre responder en español (excepto las palabras/frases en holandés que estás enseñando)

${learningContext}

Sé alentador y paciente. Mantén las respuestas concisas y fáciles de leer en móvil.`
            : `You are an expert Dutch (Nederlands) language teacher. Your role is:
- Teach Dutch in a clear and engaging way
- Give ALL explanations in ENGLISH
- Teach Dutch words and phrases, but explain in English
- Provide examples and clear explanations
- Correct mistakes gently and constructively
- Adapt to the student's level
- Make learning fun and interactive
- Use simple language when explaining complex concepts
- Provide pronunciation tips when relevant
- Always respond in English (except for the Dutch words/phrases you're teaching)

${learningContext}

Be encouraging and patient. Keep responses concise and mobile-friendly.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        parts: [{ text: message }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const assistantMessage = data.candidates[0].content.parts[0].text;
        
        hideLoading();
        addMessage('assistant', assistantMessage);
        
        // Update learning data
        extractLearningData(message, assistantMessage);
        learningData.totalMessages += 2;
        learningData.lastSession = new Date().toISOString();
        
        // Add session if this is the first message of the day
        const today = new Date().toDateString();
        const lastSessionDate = learningData.lastSession ? new Date(learningData.lastSession).toDateString() : null;
        
        if (lastSessionDate !== today) {
            learningData.sessions.push({
                date: new Date().toISOString(),
                messages: 2
            });
        } else if (learningData.sessions.length > 0) {
            learningData.sessions[learningData.sessions.length - 1].messages += 2;
        } else {
            learningData.sessions.push({
                date: new Date().toISOString(),
                messages: 2
            });
        }
        
        saveLearningData();
        updateSessionInfo();
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: assistantMessage }] }
        );
        
        // Keep only last 10 exchanges
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
        
    } catch (error) {
        hideLoading();
        const errorMsg = explanationLang === 'Spanish'
            ? 'Error: ' + error.message + '. Por favor verifica tu API key e intenta de nuevo.'
            : 'Error: ' + error.message + '. Please check your API key and try again.';
        showError(errorMsg);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Quick message
function sendQuickMessage(message) {
    userInput.value = message;
    sendMessage();
}

// Handle enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Progress modal functions
function showProgress() {
    const modal = document.getElementById('progressModal');
    const content = document.getElementById('progressContent');
    
    const lang = explanationLangSelect.value;
    const sessions = learningData.sessions.length;
    const vocabulary = learningData.vocabulary.length;
    const topics = learningData.topics.length;
    const messages = learningData.totalMessages;
    
    let html = '';
    
    if (lang === 'Spanish') {
        html = `
            <div class="progress-stats">
                <div class="stat-card">
                    <div class="stat-number">${sessions}</div>
                    <div class="stat-label">Sesiones</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${vocabulary}</div>
                    <div class="stat-label">Palabras</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${topics}</div>
                    <div class="stat-label">Temas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${messages}</div>
                    <div class="stat-label">Mensajes</div>
                </div>
            </div>
        `;
        
        if (learningData.topics.length > 0) {
            html += `
                <div class="progress-section">
                    <h3>📚 Temas Estudiados</h3>
                    ${learningData.topics.slice(-10).map(topic => 
                        `<div class="progress-item">${topic}</div>`
                    ).join('')}
                </div>
            `;
        }
        
        if (learningData.vocabulary.length > 0) {
            html += `
                <div class="progress-section">
                    <h3>📝 Vocabulario Reciente</h3>
                    <div class="progress-item">${learningData.vocabulary.slice(-20).join(', ')}</div>
                </div>
            `;
        }
        
        if (sessions === 0 && messages === 0) {
            html = '<p style="text-align: center; color: #666;">¡Empieza a aprender para ver tu progreso aquí!</p>';
        }
    } else {
        html = `
            <div class="progress-stats">
                <div class="stat-card">
                    <div class="stat-number">${sessions}</div>
                    <div class="stat-label">Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${vocabulary}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${topics}</div>
                    <div class="stat-label">Topics</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${messages}</div>
                    <div class="stat-label">Messages</div>
                </div>
            </div>
        `;
        
        if (learningData.topics.length > 0) {
            html += `
                <div class="progress-section">
                    <h3>📚 Topics Studied</h3>
                    ${learningData.topics.slice(-10).map(topic => 
                        `<div class="progress-item">${topic}</div>`
                    ).join('')}
                </div>
            `;
        }
        
        if (learningData.vocabulary.length > 0) {
            html += `
                <div class="progress-section">
                    <h3>📝 Recent Vocabulary</h3>
                    <div class="progress-item">${learningData.vocabulary.slice(-20).join(', ')}</div>
                </div>
            `;
        }
        
        if (sessions === 0 && messages === 0) {
            html = '<p style="text-align: center; color: #666;">Start learning to see your progress here!</p>';
        }
    }
    
    content.innerHTML = html;
    modal.classList.add('show');
}

function closeProgress() {
    const modal = document.getElementById('progressModal');
    modal.classList.remove('show');
}

function clearProgress() {
    const lang = explanationLangSelect.value;
    const confirmMsg = lang === 'Spanish'
        ? '¿Estás seguro de que quieres borrar todo tu progreso? Esta acción no se puede deshacer.'
        : 'Are you sure you want to clear all your progress? This action cannot be undone.';
    
    if (confirm(confirmMsg)) {
        learningData = {
            sessions: [],
            vocabulary: [],
            topics: [],
            totalMessages: 0,
            startDate: new Date().toISOString(),
            lastSession: null
        };
        saveLearningData();
        updateSessionInfo();
        closeProgress();
        
        const successMsg = lang === 'Spanish'
            ? '✅ Progreso borrado. ¡Empecemos de nuevo!'
            : '✅ Progress cleared. Let\'s start fresh!';
        addMessage('assistant', successMsg);
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
