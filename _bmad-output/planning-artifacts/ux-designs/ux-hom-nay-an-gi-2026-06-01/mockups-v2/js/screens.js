(function() {
  var toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.setAttribute('role', 'status');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
  window.showToast = function(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    requestAnimationFrame(function() {
      el.classList.add('show');
    });
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { el.remove(); }, 300);
    }, 4000);
  };
  // Collapsible sections
  document.addEventListener('click', function(e) {
    var header = e.target.closest('.collapsible-header');
    if (header) {
      header.parentElement.classList.toggle('open');
      var isOpen = header.parentElement.classList.contains('open');
      header.setAttribute('aria-expanded', isOpen);
      var chevron = header.querySelector('span:last-child');
      if (chevron) chevron.textContent = isOpen ? '▴' : '▾';
    }
  });
  // Chip toggle
  document.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip-row .chip');
    if (chip) {
      var isActive = chip.classList.contains('active');
      // If single-select (cooking time chips), deactivate siblings
      if (chip.closest('.chip-row') && !chip.closest('.chip-row').classList.contains('multi')) {
        chip.closest('.chip-row').querySelectorAll('.chip.active').forEach(function(c) {
          if (c !== chip) c.classList.remove('active');
        });
      }
      chip.classList.toggle('active');
    }
  });
  // Toggle list item checkbox
  document.addEventListener('click', function(e) {
    var check = e.target.closest('.list-item-check');
    if (check) {
      check.closest('.list-item').classList.toggle('checked');
    }
  });
})();
