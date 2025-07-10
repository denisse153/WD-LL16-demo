// Get chatbot elements
const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
const chatbotPanel = document.getElementById('chatbotPanel');

if (chatbotToggleBtn && chatbotPanel) {
  // Toggle chat open/closed when clicking the button
  chatbotToggleBtn.addEventListener('click', () => {
    chatbotPanel.classList.toggle('open');
  });

  // Close chat when clicking anywhere except the chat panel or button
  document.addEventListener('click', (e) => {
    // If chat is open AND user clicked outside chat area, close it
    if (chatbotPanel.classList.contains('open') && 
        !chatbotPanel.contains(e.target) && 
        !chatbotToggleBtn.contains(e.target)) {
      chatbotPanel.classList.remove('open');
    }
  });
}

// Get chat input, send button, and messages container
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSendBtn = document.getElementById('chatbotSendBtn');
const chatbotMessages = document.getElementById('chatbotMessages');

// Function to add a message to the chat window
function addMessage(text, sender) {
  // Create a new div for the message
  const messageDiv = document.createElement('div');
  // Add a class for styling (user or assistant)
  messageDiv.className = sender === 'user' ? 'chatbot-message user' : 'chatbot-message assistant';
  // If the sender is assistant, format the text with line breaks for sections
  if (sender === 'assistant') {
    // If the message is the special string 'Thinking...', show animation
    if (text === 'Thinking...') {
      messageDiv.innerHTML = `<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span> Thinking`;
    } else {
      // Replace double line breaks or section headers with <br><br> for spacing
      // Also add a class for extra spacing between sections
      // This will split on lines that start with a section label (e.g., "Script:", "Tone:", "CTA:")
      let formatted = text
        .replace(/\n\s*\n/g, '<br><br>') // double line breaks
        .replace(/(Script:|Tone:|CTA:|Music:|Visual Direction:|Voiceover:)/g, '<br><strong>$1</strong>')
        .replace(/\n/g, '<br>');
      messageDiv.innerHTML = formatted;
    }
  } else {
    // For user, just show plain text
    messageDiv.textContent = text;
  }
  // Add the message to the chat window
  chatbotMessages.appendChild(messageDiv);
  // Scroll to the bottom so the latest message is visible
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Function to send message to OpenAI API and get a response
async function sendMessageToOpenAI(userMessage) {
  // Add the user's message to the chat window
  addMessage(userMessage, 'user');

  // Show a loading message while waiting for the response
  addMessage('Thinking...', 'assistant');
  // Keep a reference to the last message so we can remove it later
  let thinkingMsg = chatbotMessages.querySelector('.assistant:last-child');

  try {
    // Send a POST request to OpenAI's API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use your API key from secrets.js
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use the gpt-4o model
        messages: [
          { role: 'system', content: `You are WayChat, Waymark’s friendly creative assistant.

Waymark is a video ad creation platform that helps people turn ideas, products, or messages into high-quality, ready-to-run videos. The platform is used by small businesses, agencies, and marketers to create broadcast-   ads with minimal friction.

Your job is to help users shape raw input — whether it’s a business name, a tagline, a product, a vibe, or a rough idea — into a short-form video concept.

Your responses may include suggested video structures, voiceover lines, tone and visual direction, music suggestions, and clarifying follow-up questions.

If the user's input is unclear, ask 1–2 short questions to help sharpen the direction before offering creative suggestions.

Only respond to questions related to Waymark, its tools, its platform, or the creative process of making short-form video ads. If a question is unrelated, politely explain that you're focused on helping users create video ads with Waymark.

Keep your replies concise, collaborative, and focused on helping users express their message clearly. Always align with modern marketing best practices — and stay supportive and friendly.`   },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8, // Make the assistant more creative
        max_tokens: 300   // Keep responses short and focused
      })
    });

    // Parse the JSON response
    const data = await response.json();

    // Remove the thinking animation (search for the .thinking-dots span)
    const loadingMsg = chatbotMessages.querySelector('.assistant .thinking-dots')?.parentElement;
    if (loadingMsg) {
      chatbotMessages.removeChild(loadingMsg);
    }

    // Get the assistant's reply
    const assistantReply = data.choices && data.choices[0].message.content
      ? data.choices[0].message.content
      : 'Sorry, I could not understand that.';

    // Add the assistant's reply to the chat window
    addMessage(assistantReply, 'assistant');
  } catch (error) {
    // Remove the thinking animation if there's an error
    const loadingMsg = chatbotMessages.querySelector('.assistant .thinking-dots')?.parentElement;
    if (loadingMsg) {
      chatbotMessages.removeChild(loadingMsg);
    }
    // Show an error message
    addMessage('Oops! Something went wrong.', 'assistant');
  }
}

// Listen for send button click
if (chatbotSendBtn && chatbotInput) {
  chatbotSendBtn.addEventListener('click', () => {
    const userMessage = chatbotInput.value.trim();
    if (userMessage) {
      sendMessageToOpenAI(userMessage);
      chatbotInput.value = ''; // Clear input box
    }
  });

  // Also send message when user presses Enter
  chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      chatbotSendBtn.click();
    }
  });
}
