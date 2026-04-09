const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((el) => revealObserver.observe(el));

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
  });
}

const navItems = document.querySelectorAll('.nav-links a');
navItems.forEach((item) => {
  item.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      if (menuToggle) {
        menuToggle.textContent = '☰';
      }
    }
  });
});

const thankYouModal = document.querySelector('.thank-you-modal');
const modalClose = document.querySelector('.modal-close');
const modalAction = document.querySelector('.modal-action');

function openThankYouModal() {
  if (thankYouModal) {
    thankYouModal.classList.add('open');
  }
}

function closeThankYouModal() {
  if (thankYouModal) {
    thankYouModal.classList.remove('open');
  }
}

if (modalClose) {
  modalClose.addEventListener('click', closeThankYouModal);
}

if (modalAction) {
  modalAction.addEventListener('click', closeThankYouModal);
}

if (thankYouModal) {
  thankYouModal.addEventListener('click', (event) => {
    if (event.target === thankYouModal) {
      closeThankYouModal();
    }
  });
}

// Handle contact form submission and save enquiry to Supabase
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = contactForm.querySelector('input[type="text"]')?.value || '';
    const email = contactForm.querySelector('input[type="email"]')?.value || '';
    const message = contactForm.querySelector('textarea')?.value || '';
    
    try {
      const response = await fetch(
        'https://anleaexwfuafgtwfvfin.supabase.co/functions/v1/save-enquiry',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            message,
            submittedAt: new Date().toISOString(),
          }),
        }
      );
      
      if (response.ok) {
        contactForm.reset();
        openThankYouModal();
      } else {
        console.error('Error submitting form');
        alert('There was an issue submitting your enquiry. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your enquiry. Please try again or contact directly at bcsachin14@gmail.com');
    }
  });
}

// Chat widget logic
const chatWidget = document.querySelector('.chat-widget');
const chatHandle = document.getElementById('chatDragHandle');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const quickButtons = document.querySelectorAll('.chat-quick-btn');
const chatToggle = document.getElementById('chatToggle');

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatChatText(text) {
  const escaped = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const lines = escaped.split(/\r?\n/);
  let formatted = '';
  let listOpen = false;
  let listType = '';

  function closeList() {
    if (listOpen) {
      formatted += `</${listType}>`;
      listOpen = false;
      listType = '';
    }
  }

  lines.forEach((line) => {
    const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);

    if (orderedMatch) {
      if (!listOpen || listType !== 'ol') {
        closeList();
        formatted += '<ol>';
        listOpen = true;
        listType = 'ol';
      }
      formatted += `<li>${orderedMatch[1]}</li>`;
    } else if (unorderedMatch) {
      if (!listOpen || listType !== 'ul') {
        closeList();
        formatted += '<ul>';
        listOpen = true;
        listType = 'ul';
      }
      formatted += `<li>${unorderedMatch[1]}</li>`;
    } else if (!line.trim()) {
      closeList();
      formatted += '<br/>';
    } else {
      closeList();
      formatted += `<p>${line}</p>`;
    }
  });

  closeList();
  return formatted;
}

function appendMessage(role, text) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  const content = document.createElement('div');
  content.className = 'message-content';

  if (role === 'bot') {
    content.innerHTML = formatChatText(text);
  } else {
    content.textContent = text;
  }

  message.appendChild(content);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatQuestion(question) {
  if (!question || !question.trim()) {
    chatInput.focus();
    return;
  }

  appendMessage('user', question);
  chatInput.value = '';

  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'message bot';
  loadingMessage.innerHTML = '<div class="message-content">Thinking...</div>';
  chatMessages.appendChild(loadingMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch('https://anleaexwfuafgtwfvfin.supabase.co/functions/v1/chat-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
      },
      body: JSON.stringify({ question }),
    });

    const payload = await response.json();
    const answer = payload?.answer || payload?.message || payload?.data?.answer || payload?.data?.message || JSON.stringify(payload);

    loadingMessage.remove();

    if (!response.ok) {
      appendMessage('bot', 'Sorry, I could not get a response. Please check the API key or network.');
      console.error('Chat API Error', payload);
      return;
    }

    appendMessage('bot', answer);
  } catch (error) {
    loadingMessage.remove();
    console.error('Chat request failed:', error);
    appendMessage('bot', 'Unable to connect to the chat service. Please try again later.');
  }
}

if (chatSend) {
  chatSend.addEventListener('click', () => {
    sendChatQuestion(chatInput.value);
  });
}

if (chatInput) {
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendChatQuestion(chatInput.value);
    }
  });
}

quickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const question = button.textContent.trim();
    sendChatQuestion(question);
  });
});

if (chatToggle && chatWidget) {
  chatToggle.addEventListener('click', (event) => {
  event.stopPropagation();

  const isCollapsed = !!chatWidget.classList.contains('chat-collapsed');
   chatToggle.textContent = isCollapsed ? '-' : '+';
  if (isCollapsed) {
    // OPEN → move to center
    chatWidget.classList.add('chat-open');
    chatWidget.classList.remove('chat-collapsed');
    
   
  } else {
    // CLOSE → move back to bottom-right
   chatWidget.classList.add('chat-collapsed');
    chatWidget.classList.remove('chat-open');
     

    // // // reset position
    // chatWidget.style.left = '';
    // chatWidget.style.top = '';
    // // chatWidget.style.transform = '';
    // chatToggle.textContent = '-';
  }
});
}



function onDragStart(event) {
  const pointer = event.touches ? event.touches[0] : event;
  if (!chatWidget) return;

  const rect = chatWidget.getBoundingClientRect();
  dragOffsetX = pointer.clientX - rect.left;
  dragOffsetY = pointer.clientY - rect.top;
  isDragging = true;

  chatWidget.style.right = 'auto';
  chatWidget.style.bottom = 'auto';
  chatWidget.style.left = `${rect.left}px`;
  chatWidget.style.top = `${rect.top}px`;

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(event) {
  if (!isDragging || !chatWidget) return;
  const pointer = event.touches ? event.touches[0] : event;
  event.preventDefault();

  const rect = chatWidget.getBoundingClientRect();
  const x = clamp(pointer.clientX - dragOffsetX, 0, window.innerWidth - rect.width);
  const y = clamp(pointer.clientY - dragOffsetY, 0, window.innerHeight - rect.height);

  chatWidget.style.left = `${x}px`;
  chatWidget.style.top = `${y}px`;
}

function onDragEnd() {
  isDragging = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
}

if (chatHandle) {
  chatHandle.addEventListener('mousedown', onDragStart);
  chatHandle.addEventListener('touchstart', onDragStart, { passive: true });
}
