/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on selection.html web page UI and behaviors.
 * It allows users to select room and reserve a room.
 *
 */
"use strict";

(function() {

  const SEARCH_KEYS = ["destination", "start", "end", "number-of-guest"];
  const SELECTION_DIV = ["search-results", "check-out", "confirm-pay"];

  // date constants
  const ONE_DAY = 86400000;
  const DAY_ABBR = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"];

  // after 2 seconds, it will go to confirm page
  const GO_TO_CONFIRM_PAGE = 2000;

  // selected room's id.
  let roomId = null;

  // number of nights the customer will stay
  let nights = null;

  // search results
  let searchResults = JSON.parse(getItem("results"));

  // global module variable
  let username = window.localStorage.getItem("current-user");

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Add behaviors to the HTML elements.
   */
  function init() {
    isLogged();

    // inherit the previous search query
    setSearchValues();
    displaySearchResults(searchResults);

    // new search
    id("edit-stay-btn").addEventListener("click", displaySearchMenu);
    qs("#edit-stay").addEventListener("submit", (form) => {
      form.preventDefault();
      search();
    });

    // procedure button
    SELECTION_DIV.forEach(name => {
      qs("button." + name).addEventListener("click", () => {
        changeProcedure(name);
      });
    });

    // display room-details modals
    qsa(".choose").forEach(
      button => button.addEventListener("click", openRoomInfoModal)
    );

    // select a room
    qs("#room-info button").addEventListener("click", selectRoom);

    // filter search results
    filter();

    // to check the information of card.
    id("checkout-info").addEventListener("submit", (form) => {
      form.preventDefault();
      checkPayment();
    });

    id("checkout-info").addEventListener("input", () => {
      addClass(id("payment-fault"), "hidden");
    });

    // to confirm and pay for the order
    id("pay").addEventListener("click", pay);

  }

  /**
   * If the user has logged in, the user can proceed to the check out section
   * without logging in again.
   */
  function isLogged() {
    if (username !== null) {
      addClass(id("check-user"), "hidden");
      removeClass(id("checkout-info"), "hidden");
    }
  }

  /** ------------------------------ Set Previous Search  ------------------------------ */

  /**
   * Set search input values the same as the previous search results,
   */
  function setSearchValues() {
    SEARCH_KEYS.forEach(function(key) {
      id(key).value = getItem(key);
    });
  }

  /** ------------------------------ New Search  ------------------------------ */

  /**
   * search the room that qualify the requirements
   */
  function search() {
    let params = new FormData(id("edit-stay"));

    fetch("/search", {method: "POST", body: params})
      .then(statusCheck)
      .then(res => res.json())
      .then(displaySearchResults)
      .catch(handleSearchError);
  }

  /**
   * Display all the rooms that matched the query.
   * @param {object[]} res - an array of JSON object of each room's information.
   */
  function displaySearchResults(res) {
    // save the new search results and queries;
    searchResults = res;
    window.sessionStorage.setItem("results", JSON.stringify(res));
    saveSearchValues();

    // change the current stay
    setStay();

    // clear the old search
    id("search-rooms").innerHTML = "";
    if (res.length > 1) {
      qs("#search-results > p").textContent = "We found " + res.length + " rooms \
      for you.";
    } else {
      qs("#search-results > p").textContent = "We found 1 room for you.";
    }

    for (let i = 0; i < res.length; i++) {
      addOneRoom(res[i]);
    }

    // maintain the filter status quo
    filterSearchResults();

    // clear previous selection;
    roomId = null;
    changeProcedure("search-results");
    updateReservation(true);
  }

  /**
   * Save the search queries to the session cookies.
   */
  function saveSearchValues() {
    SEARCH_KEYS.forEach(key => window.sessionStorage.setItem(key, id(key).value));
  }

  /**
   * Add a room card to the search results.
   * @param {object} room - a JSON object providing the room's information
   */
  function addOneRoom(room) {

    let roomCard = gen("div");
    roomCard.id = room.rid;
    roomCard.classList.add("room-card");

    roomCard.appendChild(genTextElement("p", "\u2713", ["hidden", "selected"]));

    let infoIcon = genTextElement("p", "\u24D8", ["infoIcon"]);
    roomCard.appendChild(infoIcon);

    let image = genImage(room.shortname, room.name);
    roomCard.appendChild(image);

    let name = genTextElement("p", room.name, ["choose"]);
    roomCard.appendChild(name);

    [infoIcon, image, name].forEach(key => key.addEventListener("click", openRoomInfoModal));

    let button = genTextElement("button", "Select Room $", []);
    button.appendChild(genTextElement("span", room.price, []));
    button.addEventListener("click", selectRoom);
    roomCard.appendChild(button);

    id("search-rooms").appendChild(roomCard);
  }

  /**
   * Create and return an image DOM element with given src and alt.
   * @param {string} src - the shortname of the room
   * @param {string} alt - the name of the room
   * @returns {object} a New img DOM object.
   */
  function genImage(src, alt) {
    let image = gen("img");
    image.src = "image/" + src + ".png";
    image.alt = alt;

    return image;
  }

  /**
   * Create and return the given text element with given text content and class.
   * @param {string} tagName - a HTML tag name
   * @param {string} text - a text string
   * @param {string[]} className - an array of class name strings
   * @returns {object} New DOM object for given HTML tag.
   */
  function genTextElement(tagName, text, className) {
    let element = gen(tagName);
    element.textContent = text;
    className.forEach(name => addClass(element, name));

    return element;
  }

  /**
   * Handle the search error.
   * @param {string} error - error message
   */
  function handleSearchError(error) {
    qs("#search-results > p").textContent = error;
  }

  /** ------------------------------ Set current stay  ------------------------------ */

  /**
   * Set the customer's current stay plan.
   */
  function setStay() {
    let city = id("destination").value;
    setAside(city);

    id("city").textContent = city;
    id("stay-date").textContent = toDateFormat();

    if (id("number-of-guest").value > 1) {
      id("room-guest").textContent = id("number-of-guest").value + " guests";
    } else {
      id("room-guest").textContent = "1 guest";
    }
  }

  /**
   * Return a string representing the customer's stay time.
   * @returns {string} return a string in the format
   * Fri, Dec 10, 2021 - Sat, Dec 11, 2021 (1 night);
   */
  function toDateFormat() {
    let start = new Date(id("start").value);
    let end = new Date(id("end").value);

    return toDateFormatHelper(start) + " - " + toDateFormatHelper(end) +
    " (" + dateDiff(start, end) + ")";
  }

  /**
   * Return a string representing the given date in the format of Mon, Dec 12, 2021.
   * @param {object} date - date Object
   * @returns {string} a string in the format of "Mon, Dec 12, 2021"
   */
  function toDateFormatHelper(date) {
    let day = DAY_ABBR[date.getDay()];
    let month = MONTH_ABBR[date.getMonth()];
    let year = date.getFullYear();

    return day + ", " + month + " " + (date.getDate() + 1) + ", " + year;
  }

  /**
   * Return the day differences between two dates.
   * @param {object} date1 - date object
   * @param {object} date2 - date object
   * @returns {int} return the day differences between two dates
   */
  function dateDiff(date1, date2) {
    nights = Math.ceil(Math.abs(date2 - date1) / ONE_DAY);
    if (nights > 1) {
      return nights + " nights";
    }

    return "1 night";
  }

  /**
   * Set the aside section.
   * @param {string} city - city name
   */
  function setAside(city) {
    fetch("/hotel/" + city)
      .then(statusCheck)
      .then(res => res.json())
      .then(displayHotelInfo)
      .catch(handleAsideError);
  }

  /**
   * Display the hotel image, address and phone number to the aside section.
   * @param {object[]} res - an array of JSON object of hotel's information
   */
  function displayHotelInfo(res) {
    let image = qs("#hotel img");
    image.src = "image/" + res.city.toLowerCase() + ".png";
    image.alt = res.city + "Husky Hotel";

    let hotelInfo = qsa("#hotel p");
    let texts = [res.city + "Husky", res.address, res.tel];

    for (let i = 0; i < hotelInfo.length; i++) {
      hotelInfo[i].textContent = texts[i];
    }
  }

  /**
   * Handle the case when failed to fetch hotel information from the database;
   * @param {string} error - the error message
   */
  function handleAsideError(error) {
    let alert = qs("#hotel .alert");
    displayError(alert, error);
  }

  /** ------------------------------- go to the check-out process --------------------- */

  /**
   * Check whether the user inputs a valid payment method.
   */
  function checkPayment() {
    let params = new FormData(id("checkout-info"));

    fetch("/payment", {method: "POST", body: params})
      .then(statusCheck)
      .then(res => res.text())
      .then(() => {
        changeProcedure("confirm-pay");
        enableButton(qs("button.confirm-pay"));
        confirmInfo();
      })
      .catch(handlePaymentError);
  }

  /**
   * to display the error message on the page
   * @param {string} error - the error type
   */
  function handlePaymentError(error) {
    let fault = id("payment-fault");
    displayError(fault, error);
  }

  /** ------------------------------- Confirm & Pay------------------------------ */

  /**
   * to update the information on confirmation page
   */
  function confirmInfo() {

    let confirm = [];
    ["city", "room", "stay-date", "room-guest", "total-price"].forEach(
      key => confirm.push(id(key).textContent)
    );

    let inputs = ["book-name", "email", "card-name", "card-number"];
    inputs.forEach(input => confirm.push(id(input).value));

    confirm.push(getExpDate(), id("security").value);

    let confirmSpan = qsa("#confirm-pay span");

    for (let i = 0; i < confirmSpan.length; i++) {
      let span = confirmSpan[i];
      span.textContent = confirm[i];
    }
  }

  /**
   * Get expiration data.
   * @returns {string} card's expiration date "00/00"
   */
  function getExpDate() {
    let month = id("month").value;
    let year = id("year").value;
    return month + "/" + year;
  }

  /**
   * Try to place a order. If success, open the order confirmation page.
   */
  function pay() {
    id("pay").textContent = "Processing...";
    let params = [username.trim(), getItem("destination"), roomId, getItem("start"),
                  getItem("end"), getItem("total-price")];

    fetch("/place-order/" + params.join("/"))
      .then(statusCheck)
      .then(res => res.text())
      .then(afterPay)
      .catch(handleConfirmError);
  }

  /**
   * If there are conflict orders, it will go back to main page, otherwise, it will return a
   * confirmation number
   * @param {string} res - the result of whether the order is conflict or not
   */
  function afterPay(res) {
    window.localStorage.setItem("confirmResult", res);

    setTimeout(function() {
      window.open("confirm.html");
      id("pay").textContent = "Confirm & Pay";
      window.location.reload();
    }, GO_TO_CONFIRM_PAGE);
  }

  /**
   * show the error message on the webpage
   * @param {string} error - the error message
   */
  function handleConfirmError(error) {
    id("pay").textContent = "Confirm & Pay";
    let alert = qs("#confirm-pay .alert");
    displayError(alert, error);
  }

  /** ------------------------------ Toggle the Edit Menu ------------------------------ */

  /**
   * Display the search menu, set search input values, and enable the update button.
   */
  function displaySearchMenu() {
    toggleHidden(id("edit-stay").parentNode);
    enableButton(qs("#edit-stay button"));
  }

  /** ------------------------------ Open room info modal  ------------------------------ */

  /**
   * Display the room information modal.
   */
  function openRoomInfoModal() {
    roomId = this.parentNode.id;
    roomDetails(roomId);
    toggleHidden(id("room-info"));
  }

  /**
   * to fetch the information about specific room type.
   * @param {string} roomName - the shortname of a specific room
   */
  function roomDetails() {
    fetch("/room/" + roomId)
      .then(statusCheck)
      .then(res => res.json())
      .then(displayRoomDetails)
      .catch(handleRoomDetailsError);
  }

  /**
   * display the room details on the page
   * @param {object} res - a JSON of room's information.
   */
  function displayRoomDetails(res) {
    // add room name
    qs("#room-info h2").textContent = res.name;

    // add room image
    let image = qs("#room-info img");
    image.src = "image/" + res.shortname + ".png";
    image.alt = res.name;

    // add description
    qs("#description p").textContent = res.description;

    // add highlights
    addHighlight(res);

    // add price
    qs("#room-info span").textContent = "$" + res.price;
  }

  /**
   * Add room's highlights.
   * @param {object} res - a JSON of room's information.
   */
  function addHighlight(res) {
    let ul = qs("#room-info ul");

    ul.appendChild(genLi("Sleeps " + res.capacity));

    let highLights = res.highlights.split(",");

    for (let i = 0; i < highLights.length; i++) {
      ul.appendChild(genLi(highLights[i]));
    }
  }

  /**
   * Create and return a new li element with the given text content.
   * @param {string} text - li text content
   * @returns {object} a New Li DOM element
   */
  function genLi(text) {
    let li = gen("li");
    li.textContent = text;

    return li;
  }

  /**
   * Handle the error when failed to fetch a certain room information from the database.
   * @param {string} error - an error message
   */
  function handleRoomDetailsError(error) {
    let alert = qs("#room-info h2");
    alert.textContent = error;
    addClass(alert, "alert");
  }

  /** ------------------------------ Change Procedure  ------------------------------ */

  /**
   * Display the given name's section and hide all other sections. Disable other
   * sections' buttons. If the name is not "search-results", hide the filter
   * section. User can only fill the check out form once he or she logs in.
   * @param {string} name - button class name
   */
  function changeProcedure(name) {
    // display the corresponding section
    removeClass(qs("h1." + name), "hidden");
    removeClass(id(name), "hidden");

    // hide all other sections
    for (let i = 0; i < SELECTION_DIV.length; i++) {
      let current = SELECTION_DIV[i];
      if (current !== name) {
        addClass(qs("h1." + current), "hidden");
        addClass(id(current), "hidden");
      }
    }

    if (name === "search-results" || name === "check-out") {
      disableButton(qs("button.confirm-pay"));
    }

    if (name === "search-results") {
      removeClass(id("filter"), "hidden");
      if (roomId === null) {
        disableButton(qs("button.check-out"));
      }
    } else {
      addClass(id("filter"), "hidden");
    }
  }

  /** ------------------------------ Select a room  ------------------------------ */

  /**
   * Select a room.
   */
  function selectRoom() {
    deselect();
    let parent = null;

    // select from the modal or from the card
    if (this.classList.length > 0) {
      parent = id(roomId);
    } else {
      parent = this.parentNode;
      roomId = parent.id;
    }
    window.sessionStorage.setItem("rid", roomId);

    addClass(parent, "highlight");
    removeClass(parent.firstElementChild, "hidden");

    enableButton(qs("button.check-out"));

    updateReservation(false);
  }

  /**
   * Deselect all currently selected room.
   */
  function deselect() {
    let allSelected = qsa(".highlight");
    if (allSelected.length > 0) {
      allSelected.forEach(function(selected) {
        removeClass(selected, "highlight");
        addClass(selected.firstElementChild, "hidden");
      });
    }
  }

  /**
   * Update the reservation details after the user selects a room. If isClear is true
   * or no selected room, clear selection and previous reservation details;
   * @param {boolean} isClear - true or false. If true, clear all details, otherwise
   * fill in the details.
   */
  function updateReservation(isClear) {
    let texts = [];
    if (isClear || roomId === null) {
      // clear any selection
      roomId = null;
      texts = ["", "", "", "", "", ""];
    } else {
      let room = getRoomInfo();
      let totalPrice = parseInt(room.price) * parseInt(nights);
      texts = [room.city + " Husky", room.name, "x " + nights + " night(s)",
              "$" + room.price, "$" + parseInt(room.price) * parseInt(nights)];
      window.sessionStorage.setItem("total-price", parseInt(totalPrice));
    }

    // update the reservation info
    let pTags = qsa("#reservation p");

    for (let i = 0; i < pTags.length; i++) {
      pTags[i].textContent = texts[i];
    }
  }

  /**
   * Get the information of the room with rid as roomId
   * @returns {object} a JSON object containing the room's information
   */
  function getRoomInfo() {
    for (let i = 0; i < searchResults.length; i++) {
      let room = searchResults[i];
      if (room.rid === parseInt(roomId)) {
        return room;
      }
    }
  }

  /** ----------------- Update the search results according to the filter ------------------- */

  /**
   * Add behaviors to all filter options.
   */
  function filter() {
    // filter by beds
    id("1-bed").addEventListener("change", () => {
      if (id("1-bed").checked && id("2-beds").checked) {
        id("2-beds").checked = false;
      }
      filterSearchResults();
    });

    id("2-beds").addEventListener("change", () => {
      if (id("1-bed").checked && id("2-beds").checked) {
        id("1-bed").checked = false;
      }
      filterSearchResults();
    });

    // filter by Price
    id("price").addEventListener("change", filterSearchResults);
  }

  /**
   * Filter the search results. Hiding the results that are not matched,
   * and update the search results section.
   */
  function filterSearchResults() {
    let maxPrice = id("price").value;
    let bed = parseInt(getBedsRequirement());

    for (let i = 0; i < searchResults.length; i++) {
      let room = searchResults[i];
      if (room.price < maxPrice && (bed === 0 || parseInt(room.bed) === bed)) {
        removeClass(id(room.rid), "hidden");
      } else {
        addClass(id(room.rid), "hidden");
      }
    }

    let numOfCardDisplayed = qsa(".room-card:not(.hidden)").length;
    let text = qs("#search-results > p");
    if (numOfCardDisplayed <= 1) {
      text.textContent = "We found " + numOfCardDisplayed + " room for you.";
    } else {
      text.textContent = "We found " + numOfCardDisplayed + " rooms for you.";
    }
  }

  /**
   * Get the number of bed required by the user. If no requirement, return 0.
   * @returns {integer} an int representing the number of beds needed for the customer.
   * 0 means any number of beds.
   */
  function getBedsRequirement() {
    if (id("1-bed").checked) {
      return id("1-bed").value;
    } else if (id("2-beds").checked) {
      return id("2-beds").value;
    }

    return 0;
  }

  /** ------------------------------ My Helper Functions  ------------------------------ */

  /**
   * Toggle the hidden class for the given element. If the element is hidden,
   * display the element, otherwise, hide the element.
   * @param {object} element - HTML DOM object
   */
  function toggleHidden(element) {
    element.classList.toggle("hidden");
  }

  /**
   * Remove the given class from the element
   * @param {object} element - HTML DOM object
   * @param {string} className - class name
   */
  function removeClass(element, className) {
    element.classList.remove(className);
  }

  /**
   * Add the given class from the element
   * @param {object} element - HTML DOM object
   * @param {string} className - class name
   */
  function addClass(element, className) {
    element.classList.add(className);
  }

  /**
   * Enable the given button.
   * @param {object} button - HTML button element
   */
  function enableButton(button) {
    button.disabled = false;
    button.classList.remove("disabled-btn");
  }

  /**
   * Disable the given button
   * @param {object} button - HTML button element
   */
  function disableButton(button) {
    button.disabled = true;
    button.classList.add("disabled-btn");
  }

  /**
   * Add the error message to the given alert object. Display the alert.
   * @param {object} alert - a HTML DOM object with the class alert
   * @param {error} error error message
   */
  function displayError(alert, error) {
    alert.textContent = error;
    removeClass(alert, "hidden");
  }

  /**
   * Return the value of the key from the session storage
   * @param {string} key - a key name
   * @returns {string} return the value of the key
   */
  function getItem(key) {
    return window.sessionStorage.getItem(key);
  }

  /** ------------------------------ Helper Functions  ------------------------------ */
  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();