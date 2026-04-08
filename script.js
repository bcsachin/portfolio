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
