/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on user.html web page UI and
 * behaviors. It allows users to get their personal information and order information.
 *
 */

"use strict";

(function() {

  const TIME = 10;
  const A_SECOND = 1000;

  let timeId = null;
  let username = window.localStorage.getItem("last-login-user");

  window.addEventListener("load", init);

  /**
   * to initialize the webpage
   */
  function init() {
    fetchOrderInfo();

    id("user").textContent = username;

    fetchUserInfo();

    // log out
    id("log-out").addEventListener("click", logout);

    id("return").addEventListener("click", () => {
      window.close("user.html");
      clearInterval(timeId);
    });

  }

  /** ------------------------------- order information ---------------------------*/
  /**
   * fetch the order information of user
   */
  function fetchOrderInfo() {
    fetch("/order/" + username)
      .then(statusCheck)
      .then(res => res.json())
      .then(displayOrder)
      .catch(handleError);
  }

  /**
   * display the user's order on the page.
   * @param {object} res - the json format information of user's order
   */
  function displayOrder(res) {
    let tblBody = qs("#order tbody");
    for (let i = 0; i < res.length; i++) {
      let row = gen("tr");
      for (let info in res[i]) {
        let cell = gen("td");
        let cellText = document.createTextNode(res[i][info]);
        cell.appendChild(cellText);
        row.appendChild(cell);
      }
      tblBody.appendChild(row);
    }
  }

  /**
   * display the error message on the page
   * @param {string} error - the type of error
   */
  function handleError(error) {
    id("alert").classList.remove("hidden");
    qs("#alert p").textContent = error;
  }

  /** ----------------------------------user information ------------------------- */

  /**
   * get the user information.
   */
  function fetchUserInfo() {
    fetch("/userInfo/" + username)
      .then(statusCheck)
      .then(res => res.text())
      .then(displayUserInfo)
      .catch(handleError);
  }

  /**
   * Display the user information on the page.
   * @param {object} res - the user information
   */
  function displayUserInfo(res) {
    let uInfo = qsa("#user-information .editable");
    let i = 0;
    for (let info in res) {
      uInfo[i].textContent = res[info];
      i++;
    }
  }

  /** ------------------------------ Log out  ------------------------------ */

  /**
   * Log out the current user and clear all research cookies.
   */
  function logout() {
    window.sessionStorage.clear();
    window.localStorage.removeItem("current-user");

    qsa("body > *").forEach(element => element.classList.toggle("hidden"));
    countdown();
  }

  /**
   * Countdown from 10.
   */
  function countdown() {
    let timeLeft = TIME;
    id("countdown").textContent = timeLeft;
    timeId = setInterval(() => {
      if (timeLeft !== 0) {
        timeLeft = timeLeft - 1;
        id("countdown").textContent = timeLeft;
      } else {
        clearInterval(timeId);
        window.close("user.html");
      }
    }, A_SECOND);
  }

  /** ---------------------------------Helper Function ---------------------------- */

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
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
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