let formContaner = document.querySelector(".form-container");
let tabs = formContaner.querySelector(".tabs");
let tabElements = formContaner.querySelectorAll(".tabs > div");
let form = formContaner.querySelector(".form");
let formElements = formContaner.querySelectorAll(".form > div");

for (let i = 0; i < tabElements.length; i++) {
  tabElements[i].addEventListener("click", function () {
    tabs.querySelector(".active").classList.remove("active");
    tabElements[i].classList.add("active");
    form.querySelector(".active").classList.remove("active");
    formElements[i].classList.add("active");
  });
}

const showPasswordIcons = document.querySelectorAll("#show-password");

const passwordInputs = document.querySelectorAll(".password");
showPasswordIcons.forEach((icon) => {
  icon.addEventListener("click", function () {
    this.classList.toggle("fa-eye");
    const passwordInput = this.previousElementSibling; // Отримання поля введення пароля
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
  });
});

//валідація даних
function validateData(validationRules, data) {
  const errors = {};

  for (const field in data) {
    if (data.hasOwnProperty(field)) {
      const value = data[field];
      const validator = validationRules[field];

      if (validator) {
        const fieldError = validator(value);
        if (fieldError) {
          errors[field] = fieldError;
        }
      }
    }
  }

  return errors;
}

function validateName(value) {
  if (!value) {
    return "Required";
  }

  if (value.length < 3 || value.length > 15) {
    return "Username must be between 3 and 15 characters";
  }
}

function validateEmail(value) {
  if (!value) {
    return "Required";
  }

  if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(value)) {
    return "Wrong email format";
  }
}

function validatePassword(value) {
  if (!value) {
    return "Required";
  }

  if (value.length < 6) {
    return "Password must be at least 6 characters";
  }
}

function validateConfirmPassword(value, formData) {
  if (!value) {
    return "Required";
  }

  if (value !== formData.password) {
    return "Should be equal to password";
  }
}

//валідація даних форми реєстрації
function validateRegistrationData(formData) {
  const validationRules = {
    username: validateName,
    email: validateEmail,
    password: validatePassword,
    confirmPassword: (value) => validateConfirmPassword(value, formData),
  };

  let errors = validateData(validationRules, formData);

  if (formData.password !== formData.confirmPassword) {
    errors = errors || {};
    errors.confirmPassword = "Should be equal to password";
  }

  return errors;
}

//для логіну
function validateLoginData(formData) {
  const validationRules = {
    username: validateName,
    password: validatePassword,
  };

  const errors = validateData(validationRules, formData);
  return errors;
}

function displayValidationMessages(form, errors, formDataObject) {
  const errorElements = form.querySelectorAll('.error-message, .success-message');
  errorElements.forEach(element => element.remove());

  for (const field in errors) {
    const errorMessage = errors[field];
    const input = form.querySelector(`input[name="${field}"]`);
    if (input) {
      const errorElement = document.createElement('span');
      errorElement.textContent = errorMessage;
      errorElement.classList.add('error-message');
      input.parentNode.appendChild(errorElement);
      input.classList.remove('valid');
      input.classList.add('invalid');
    }
  }

  for (const field in formDataObject) {
    const value = formDataObject[field];
    const input = form.querySelector(`input[name="${field}"]`);
    if (input && !errors[field]) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      const successElement = document.createElement('span');
      successElement.textContent = 'Good job';
      successElement.classList.add('success-message');
      input.parentNode.appendChild(successElement);
    }
  }
}

function removeSuccessMessages(form) {
  const successElements = form.querySelectorAll('.success-message');
  const validInputs = form.querySelectorAll('input.valid, input.invalid');
  successElements.forEach(element => element.remove());
  validInputs.forEach(input => {
    input.classList.remove('valid', 'invalid');
  });
}

// // Обробник події для форми реєстрації
const signupForm = document.getElementById("signupForm");
const signupLoader = signupForm.querySelector(".loader");

signupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const formData = new FormData(this);
  const formDataObject = Object.fromEntries(formData.entries());
  const errors = validateRegistrationData(formDataObject);

  displayValidationMessages(this, errors, formDataObject);

  if (Object.keys(errors).length === 0) {
    signupLoader.style.display = "block";
    simulateServerRequest(formDataObject, 'registration')
      .then((response) => {
        showToaster(response);
        removeSuccessMessages(signupForm);
        signupForm.reset();
      })
      .catch((error) => {
        showToaster(error);
      })
      .finally(() => {
        signupLoader.style.display = "none";
      });
  }
});



//для логіну
const loginForm = document.getElementById('loginForm');
const loginLoader = loginForm.querySelector('.loader');

loginForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const formData = new FormData(this);
  const formDataObject = Object.fromEntries(formData.entries());
  const errors = validateLoginData(formDataObject);

  displayValidationMessages(this, errors, formDataObject);

  if (Object.keys(errors).length === 0) {
    loginLoader.style.display = 'block';
    simulateServerRequest(formDataObject, 'login')
      .then(response => {
        showToaster(response);
        removeSuccessMessages(loginForm);
        loginForm.reset();
        window.location.href = 'usersPage.html';
      })
      .catch(error => {
        showToaster(error);
      })
      .finally(() => {
        loginLoader.style.display = 'none';
      });
  }
});




function showToaster(message, duration = 3000) {
  const toasterContainer = document.getElementById("toaster-container");
  const toaster = document.createElement("div");
  toaster.textContent = message;
  toaster.classList.add("toaster");

  toasterContainer.appendChild(toaster);

  setTimeout(() => {
    toaster.style.animation = "fade-out 0.3s ease-in-out forwards";
    setTimeout(() => {
      toasterContainer.removeChild(toaster);
    }, 300);
  }, duration);
}

function simulateServerRequest(formDataObject, action) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (action === 'registration') {
        saveUserData(formDataObject);
        resolve("Registration successful");
      } else if (action === 'login') {
        const userData = getUserData();
        if (userData && userData.username === formDataObject.username && userData.password === formDataObject.password) {
          resolve("Login successful");
        } else {
          reject("Invalid username or password");
        }
      } else {
        reject("Unknown action");
      }
    }, 1500);
  });
}

// Функція для збереження даних в localStorage
function saveUserData(formDataObject) {
  const { username, email, password } = formDataObject;
  const userData = {
    username: username,
    email: email,
    password: password,
  };
  localStorage.setItem('userData', JSON.stringify(userData));
}

// Функція для отримання даних з localStorage
function getUserData() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}





