/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on selection.html and index.html web page UI and
 * behaviors. It allows users to log in and log out.
 *
 */
"use strict";

(function() {

  const SEARCH_KEYS = ["destination", "start", "end", "number-of-guest"];
  const TEN = 10;

  // global module variable
  let currentUsername = window.localStorage.getItem("current-user");

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Add behaviors to the HTML elements.
   */
  function init() {
    if (currentUsername !== null) {
      displayLoginNav();
    } else {
      displayLogoutNav();
    }

    // add behaviors to open the log in modals and close all modals
    id("log-in").addEventListener("click", openLoginModal);
    qsa(".close").forEach(element => element.addEventListener("click", closeModal));

    // set the search Menu
    setSearchValues();

    // add behaviors to update the input date
    qsa("#input-date input").forEach(
      input => input.addEventListener("input", updateInputDate)
    );

    // add behaviors to log in
    qs("#log-in-modal form").addEventListener("submit", (form) => {
      form.preventDefault();
      login();
    });

    id("username").addEventListener("input", hideAlert);
    id("password").addEventListener("input", hideAlert);

    // add behaviors to enable or disable search button
    toggleSearchBtn();
    id("destination").addEventListener("input", toggleSearchBtn);

    // add behaviors to log out
    id("log-out").addEventListener("click", logout);

    // open join us page in a new session
    qs("#not-a-member button").addEventListener("click", () => {
      window.open("join-in.html");
      id("log-in-modal").classList.add("hidden");
    });
  }

  /** ------------------------------ Change Modals  ------------------------------ */

  /**
   * Display the log in modal.
   */
  function openLoginModal() {
    toggleHidden(id("log-in-modal"));
    qs("#log-in-form form").reset();
    fillUsername();
  }

  /**
   * Fill the log in username input if the user has logged in before.
   */
  function fillUsername() {
    let lastLoginName = window.localStorage.getItem("last-login-user");
    if (lastLoginName !== null) {
      id("username").value = lastLoginName;
    }
  }

  /**
   * Close the modal.
   */
  function closeModal() {
    let container = this.parentNode.parentNode;
    let containerId = container.id;

    if (container.id === "room-info") {
      // clear the highlights part for the room-info modal
      qs("#" + containerId + " ul").innerHTML = "";

      // close the alert
      let alert = qs("#" + containerId + " h2");
      alert.innerHTML = "";
      alert.classList.remove("alert");
    } else {
      // close the alert for the log-in modal
      hideAlert();
    }

    toggleHidden(container);
  }

  /** ------------------------------ Set search menu ------------------------------ */

  /**
   * Set search input values the same as the previous search query if the previous
   * search query exists, otherwise just set the check in date as today and check out
   * date as tomorrow.
   */
  function setSearchValues() {
    setDate();
    if (checkPreviousQuery()) {
      SEARCH_KEYS.forEach(function(key) {
        id(key).value = window.sessionStorage.getItem(key);
      });
    }
  }

  /**
   * Return true if the user has searched before, otherwise return false.
   * @returns {boolean} return true if there is a record for previous query, otherwise
   * return false
   */
  function checkPreviousQuery() {
    for (let i = 0; i < SEARCH_KEYS.length; i++) {
      let key = SEARCH_KEYS[i];
      if (window.sessionStorage.getItem(key) === null) {
        return false;
      }
    }

    return true;
  }

  /**
   * Set the check in date as today and check out date as tomorrow.
   * Also set the date selection range for check in from today to one year later
   * and for check out date from tomorrow to its one year later.
   */
  function setDate() {
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setDateHelper(retrieveDate(today), id("start"));
    setDateHelper(retrieveDate(tomorrow), id("end"));
  }

  /**
   * SetDate helper function to set the date selection range.
   * @param {int[]} date - a list of integer of year, month and date.
   * @param {object} element - HTML input element
   */
  function setDateHelper(date, element) {
    let minDate = date2String(date);

    // max date
    date[0] = date[0] + 1;
    let maxDate = date2String(date);
    element.value = minDate;
    element.min = minDate;
    element.max = maxDate;
  }

  /**
   * Retrieve year, month, date, and next year from the given date object.
   * @param {object} date - Date object
   * @returns {int[]} return a list of integer of year, month and date of the
   * given date.
   */
  function retrieveDate(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  }

  /**
   * Return a string representing date in the format: "yyyy-mm-dd".
   * @param {int[]} date - a list of integers representing year, month and date
   * @returns {string} a string representing date in the format: "yyyy-mm-dd"
   */
  function date2String(date) {
    if (date[2] < TEN) {
      date[2] = "0" + date[2];
    }
    return date[0] + "-" + date[1] + "-" + date[2];
  }

  /** ------------------------------ Update the Date ------------------------------ */

  /**
   * If the check out date is larger than the check in date, update the check in
   * date to one day before the check out.
   */
  function updateInputDate() {
    let startDate = new Date(id("start").value);
    let endDate = new Date(id("end").value);

    if (startDate >= endDate) {
      id("start").value = date2String(retrieveDate(endDate));
    }
  }

  /** ------------------------------ Log In ------------------------------ */

  /**
   * Log in as the current user.
   */
  function login() {
    // remember the username if the user logged in before.
    let params = new FormData(qs("#log-in-modal form"));

    fetch("/user/login", {method: "POST", body: params})
      .then(statusCheck)
      .then(res => res.text())
      .then(afterLoginIn)
      .catch(handleLogInError);
  }

  /**
   * After user log in, hide the log in modal and display the logged-in view.
   * Save the username in the cookie.
   * @param {string} res - the username
   */
  function afterLoginIn(res) {
    // save the username
    qs("#log-in-modal form").reset();

    // remember the current logged in username
    window.localStorage.setItem("current-user", res);
    currentUsername = res;
    displayLoginNav();

    id("log-in-modal").classList.add("hidden");

    // remember the name for the next login
    window.localStorage.setItem("last-login-user", res);

    // prevent the user to go back
    if (window.location.href === "http://localhost:8000/index.html") {
      window.location.replace("http://localhost:8000/index.html");
    }

    if (window.location.href === "http://localhost:8000/selection.html") {
      id("checkout-info").classList.remove("hidden");
      id("check-user").classList.add("hidden");
    }
  }

  /**
   * Handle log in error message.
   * @param {string} error - the error message
   */
  function handleLogInError(error) {
    let alert = qs("#log-in-modal .alert");
    alert.textContent = error;
    alert.classList.remove("hidden");
  }

  /** ------------------------------ Log out  ------------------------------ */

  /**
   * Log out the current user and clear all research cookies. If the user is
   * in the selection process, reload the page.
   */
  function logout() {
    displayLogoutNav();

    // reset the log in form and search menu
    qs("#log-in-modal form").reset();
    setDate();

    window.localStorage.removeItem("current-user");

    if (window.location.href === "http://localhost:8000/" ||
    window.location.hre === "http://localhost:8000/index.html") {
      window.sessionStorage.clear();
    } else {
      window.location.reload();
    }
  }

  /** ------------------------------ Enable Search ------------------------------ */

  /**
   * Enable the search button if the destination input is not empty, otherwise
   * disable the button.
   */
  function toggleSearchBtn() {
    let input = id("destination").value.trim();
    let button = qs("#edit-stay button");

    if (input.length > 0) {
      enableButton(button);
    } else {
      disableButton(button);
    }
  }

  /**
   * Hide the alert error message for the log in modal.
   */
  function hideAlert() {
    qs("#log-in-modal .alert").classList.add("hidden");
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
   * Display the log-in navigation bar.
   */
  function displayLoginNav() {
    id("sign-in").classList.add("hidden");
    id("after-login").classList.remove("hidden");
    id("user").textContent = currentUsername;
  }

  /**
   * Display the non log in navigation bar.
   */
  function displayLogoutNav() {
    id("sign-in").classList.remove("hidden");
    id("after-login").classList.add("hidden");
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

})();