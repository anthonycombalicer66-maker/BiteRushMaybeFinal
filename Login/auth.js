document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.toggle-password');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var input = document.querySelector('#login-password');
      var icon = toggle.querySelector('i');
      if (!input || !icon) return;
      var visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      icon.classList.toggle('fa-eye', visible);
      icon.classList.toggle('fa-eye-slash', !visible);
      toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
    });
  }

  var resetForm = document.querySelector('#reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var message = document.querySelector('#reset-message');
      if (message) {
        message.hidden = false;
        message.textContent = 'A password reset link has been sent. Check your inbox to continue.';
      }
      resetForm.reset();
    });
  }
});
