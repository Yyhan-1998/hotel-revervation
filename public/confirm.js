/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on confirm.html web page UI and behaviors.
 * It displays order confirmation number or the reason why the order is unsuccessful.
 *
 */

"use strict";

(function() {

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * to initialize the main page
   */
  function init() {
    id("go-main-page").addEventListener("click", function() {
      window.close("confirm.html");
    });

    confirm();
  }

  /**
   * Display the confirm results message.
   */
  function confirm() {
    let confirmResult = window.localStorage.getItem("confirmResult");
    if (confirmResult === "0") {
      id("unable-page").classList.remove("hidden");
      id("confirm-page").classList.add("hidden");
    } else {
      id("unable-page").classList.add("hidden");
      id("confirm-page").classList.remove("hidden");
      id("confirmation-number").textContent = "# " + confirmResult;
    }

    // remove the result
    window.localStorage.removeItem("confirmResult");
  }

  /** ----------------------------------Helper Functions ---------------------------*/

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }
})();