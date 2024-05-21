const cardContainer = document.getElementById("cardContainer");
const searchInput = document.getElementById("searchInput");
const sidebar = document.getElementById("sidebar");
const filterName = document.getElementById("filterName");
const filterAge = document.getElementById("filterAge");
const filterLocation = document.getElementById("filterLocation");
const filterEmail = document.getElementById("filterEmail");
const genderRadios = document.querySelectorAll('input[name="gender"]');
const sortButtons = document.querySelectorAll(".sort button");

let users = []; //всі користувачі
let filteredUsers = []; //користувачі що відповідають фільтрації чи сортуванню
let currentPage = 1;
const pageSize = 20;
let isLoadingMoreData = false;

function fetchUsers(page = 1) {
  if (isLoadingMoreData) return;
  isLoadingMoreData = true;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  fetch(`https://randomuser.me/api/?results=${pageSize}&page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      const newUsers = data.results.map((user) => ({
        name: `${user.name.first} ${user.name.last}`,
        age: user.dob.age,
        picture: user.picture.medium,
        phone: user.phone,
        gender: user.gender,
        email: user.email,
        registered: user.registered.date,
        location: `${user.location.city}, ${user.location.country}`,
      }));
      users = [...users, ...newUsers];
      filteredUsers = [...filteredUsers, ...newUsers];
      renderUserCards(filteredUsers.slice(0, endIndex));
      isLoadingMoreData = false;
    })
    .catch((error) => {
      isLoadingMoreData = false;
    });
}

//відображення карток
function renderUserCards(userList) {
  cardContainer.innerHTML = "";
  userList.forEach((user) => {
    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <img src="${user.picture}" alt="${user.name}">
      <div>
        <hr>
        <p>Age: ${user.age}</p>
        <p>Phone: ${user.phone}</p>
        <p>Gender: ${user.gender}</p>
        <p>${user.email}</p>
        <p>${user.location}</p>
        <p>Registered: ${new Date(user.registered).toLocaleDateString()}</p>
        <hr>
      </div>
      <span><h3>${user.name}</h3></span>
    `;
    cardContainer.appendChild(card);
  });
}

let debounceTimeout;

const getSelectedGender = () => {
  return Array.from(genderRadios).find((radio) => radio.checked).value;
};

//щоб застосувати одразу декілька фільтрів
const filterUsersByCriteria = (user, search, nameFilter, ageFilter, locationFilter, emailFilter, selectedGender) => {
  const nameMatch = user.name.toLowerCase().includes(nameFilter);
  const ageMatch = ageFilter ? user.age === parseInt(ageFilter) : true;
  const locationMatch = user.location.toLowerCase().includes(locationFilter);
  const emailMatch = user.email.toLowerCase().includes(emailFilter);
  const genderMatch =
    selectedGender === "all" || user.gender === selectedGender;
  return (
    nameMatch &&
    ageMatch &&
    locationMatch &&
    emailMatch &&
    genderMatch &&
    user.name.toLowerCase().includes(search)
  );
};

function filterUsers() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const search = searchInput.value.toLowerCase();
    const nameFilter = filterName.value.toLowerCase();
    const ageFilter = filterAge.value;
    const locationFilter = filterLocation.value.toLowerCase();
    const emailFilter = filterEmail.value.toLowerCase();
    const selectedGender = getSelectedGender();

    filteredUsers = users.filter((user) =>
      filterUsersByCriteria(user, search, nameFilter, ageFilter, locationFilter, emailFilter, selectedGender)
    );

    currentPage = 1;
    sortUsers(currentSort);
    updateURL();
    checkNoResults();
  }, 300);
}

let currentSort = "sortNameAsc";

const sortFunctions = {
  sortNameAsc: (a, b) => a.name.localeCompare(b.name),
  sortNameDesc: (a, b) => b.name.localeCompare(a.name),
  sortAgeAsc: (a, b) => a.age - b.age,
  sortAgeDesc: (a, b) => b.age - a.age,
  sortRegisteredAsc: (a, b) => new Date(a.registered) - new Date(b.registered),
  sortRegisteredDesc: (a, b) => new Date(b.registered) - new Date(a.registered),
};

function sortUsers(buttonId) {
  const sortFunction = sortFunctions[buttonId];
  if (sortFunction) {
    filteredUsers.sort(sortFunction);
    renderUserCards(filteredUsers.slice(0, currentPage * pageSize));
  }
}

function handleSortButtonClick(event) {
  sortButtons.forEach((button) => button.classList.remove("active"));
  event.target.classList.add("active");
  currentSort = event.target.id;
  sortUsers(currentSort);
  updateURL();
}

function handleScroll() {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight &&
    !isLoadingMoreData
  ) {
    currentPage++;
    fetchUsers(currentPage);
  }
}

//параметри фільтрації до URL
const addFilterParamsToURL = (queryParams) => {
  if (filterName.value) queryParams.set("name", filterName.value);
  if (filterAge.value) queryParams.set("age", filterAge.value);
  if (filterLocation.value) queryParams.set("location", filterLocation.value);
  if (filterEmail.value) queryParams.set("email", filterEmail.value);
  const selectedGender = getSelectedGender();
  if (selectedGender !== "all") queryParams.set("gender", selectedGender);
};

//параметри сортування до URL
const addSortParamToURL = (queryParams) => {
  const activeSortButton = Array.from(sortButtons).find((btn) =>
    btn.classList.contains("active")
  );
  if (activeSortButton) {
    queryParams.set("sort", activeSortButton.id);
  }
};

function updateURL() {
  const queryParams = new URLSearchParams();

  addFilterParamsToURL(queryParams);
  addSortParamToURL(queryParams);

  const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
  window.history.replaceState(null, null, newUrl);
}

function readURLParams() {
  const queryParams = new URLSearchParams(window.location.search);

  //для фільтрів
  if (queryParams.has("name")) filterName.value = queryParams.get("name");
  if (queryParams.has("age")) filterAge.value = queryParams.get("age");
  if (queryParams.has("location"))
    filterLocation.value = queryParams.get("location");
  if (queryParams.has("email")) filterEmail.value = queryParams.get("email");
  if (queryParams.has("gender")) {
    const selectedGender = queryParams.get("gender");
    genderRadios.forEach(
      (radio) => (radio.checked = radio.value === selectedGender)
    );
  }

  //для сортування
  if (queryParams.has("sort")) {
    const sortCriteria = queryParams.get("sort");
    const activeButton = Array.from(sortButtons).find(
      (btn) => btn.id === sortCriteria
    );
    if (activeButton) {
      sortButtons.forEach((btn) => btn.classList.remove("active"));
      activeButton.classList.add("active");
      currentSort = sortCriteria;
    }
  }

  filterUsers();
  sortUsers(currentSort);
}

function resetFilters() {
  searchInput.value = "";
  filterName.value = "";
  filterAge.value = "";
  filterLocation.value = "";
  filterEmail.value = "";
  genderRadios.forEach((radio) => (radio.checked = radio.value === "all"));
  filteredUsers = users;
  //   currentPage = 1;
  sortButtons.forEach((button) => button.classList.remove("active"));
  renderUserCards(filteredUsers.slice(0, pageSize));
}


function checkNoResults() {
  const noResultsModal = document.getElementById("noResultsModal");

  //значення всіх полів вводу
  const search = searchInput.value.trim();
  const nameFilter = filterName.value.trim();
  const ageFilter = filterAge.value.trim();
  const locationFilter = filterLocation.value.trim();
  const emailFilter = filterEmail.value.trim();

  //чи всі поля вводу порожні
  const areAllFiltersEmpty = !search && !nameFilter && !ageFilter && !locationFilter && !emailFilter ;

  if (filteredUsers.length === 0 && !areAllFiltersEmpty) {
    noResultsModal.style.display = "block";
  } else {
    noResultsModal.style.display = "none";
  }
}


searchInput.addEventListener("input", () => {
  filterUsers();
});

const filtersContainer = document.querySelector(".filter");

filtersContainer.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("input")) {
    filterUsers();
    updateURL();
  }
});

filtersContainer.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches('input[type="radio"]')) {
    filterUsers();
    updateURL();
  }
});

const sortContainer = document.querySelector(".sort");

sortContainer.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  sortButtons.forEach((button) => button.classList.remove("active"));
  target.classList.add("active");
  currentSort = target.id;
  sortUsers(currentSort);
  updateURL();
});

document.getElementById("resetButton").addEventListener("click", () => {
  resetFilters();
  updateURL();
});

document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("userData");
  window.location.href = "index.html";
});

//burger menu toggle
document.querySelector(".burger").addEventListener("click", () => {
  sidebar.classList.toggle("show");
});


document.querySelector(".close").addEventListener("click", () => {
  const noResultsModal = document.getElementById("noResultsModal");
  noResultsModal.style.display = "none";
});

window.addEventListener("load", () => {
  fetchUsers();
  readURLParams();
});

window.addEventListener("scroll", handleScroll);
