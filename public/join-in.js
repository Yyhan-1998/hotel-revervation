/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on join-in.html web page UI and behaviors.
 * It allows users to be a membership of Husky Hotel.
 *
 */
"use strict";

(function() {

  const TIME = 10;
  const A_SECOND = 1000;

  let timeId = null;

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Add behaviors to the HTML elements.
   */
  function init() {
    // add behaviors to the sign up
    id("sign-up").addEventListener("submit", (form) => {
      form.preventDefault();
      signup();
    });

    id("return").addEventListener("click", () => {
      window.location.href = "index.html";
      clearInterval(timeId);
    });
  }

  /**                   show all items on the main page                  */
  function signup() {
    let params = new FormData(id("sign-up"));
    let password = id("password").value;
    let regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,32}$";
    let matchResult = password.match(regex);

    // the password does not match the regular expression.
    if (!matchResult) {
      id("alert").classList.remove("hidden");
      qs("#alert p").textContent = "The password does not qualify our requirement.";
      id("password").value = "";
      id("confirm").value = "";
    } else {
      fetch("/user/signup", {method: "POST", body: params})
        .then(statusCheck)
        .then(res => res.text())
        .then(register)
        .catch(handleError);
    }
  }

  /**
   * Save the username to the cookies. Go back to the coming html page.
   * @param {text} res - username
   */
  function register(res) {
    window.localStorage.setItem("last-login-user", res);
    id("sign-up").reset();
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
        window.location.href = "index.html";
      }
    }, A_SECOND);
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
   * print the error.
   * @param {string} error - the type of error.
   */
  function handleError(error) {
    id("alert").classList.remove("hidden");
    qs("#alert p").textContent = error;
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