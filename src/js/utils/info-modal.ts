// Wiring for the landing page "Info" modal, which holds the hero,
// features, security, and testimonials sections moved off the main screen.

const openBtn = document.getElementById('info-modal-open');
const modal = document.getElementById('info-modal');
const closeBtn = document.getElementById('info-modal-close');

if (openBtn && modal && closeBtn) {
  const open = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // Backdrop click closes
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  // Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });

  // In-page anchor links inside the modal (e.g. hero CTA) should close it
  // so the underlying page can scroll to the target.
  modal.addEventListener('click', (e) => {
    const anchor = (e.target as HTMLElement).closest?.('a[href^="#"]');
    if (anchor) close();
  });
}
