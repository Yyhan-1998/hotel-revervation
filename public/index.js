/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the js file managing behaviors on index.html web page UI and behaviors.
 * It allows users to log in, log out, and search and check each room's information.
 *
 */
"use strict";

(function() {

  // constants
  const SLIDESHOW_INTERVAL = 5000;
  const MIN_WINDOW_WIDTH = 600;
  const SEARCH_KEYS = ["destination", "start", "end", "number-of-guest"];

  let timeId = null;

  /**
   * Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", init);

  /**
   * Add a function that will be called when the window is resized.
   */
  window.addEventListener("resize", layOut);

  /**
   * Add behaviors to the HTML elements.
   */
  function init() {
    // get all rooms
    fetchRooms();

    // display room-details modals
    qsa("#room-types button").forEach(
      button => button.addEventListener("click", openRoomInfoModal)
    );

    // slide show
    autoSlideshow();
    id("prev").addEventListener("click", () => {
      slideshow(false);
    });

    id("next").addEventListener("click", () => {
      slideshow(true);
    });

    // modify the layout of room types
    qs("#modify-layout button").addEventListener("click", modifyLayout);

    // search
    id("edit-stay").addEventListener("submit", (form) => {
      form.preventDefault();
      search();
    });

    // clear search error message
    SEARCH_KEYS.forEach(function(key) {
      id(key).addEventListener("input", () => {
        // clear all the alert for the search menu
        addClass(qs("#edit-stay .alert"), "hidden");
      });
    });
  }

  /**                   show all items on the main page                  */

  /**
   * fetch the information of rooms from the api.
   */
  function fetchRooms() {
    fetch("/all")
      .then(statusCheck)
      .then(res => res.json())
      .then(displayAllRooms)
      .catch(handleAllError);
  }

  /**
   * This function is to display all the rooms on the main page.
   * @param {object} res - the information about all rooms name.
   */
  function displayAllRooms(res) {
    for (let i = 0; i < res.length; i++) {
      addOneRoom(res[i]);
    }
  }

  /**
   * Add a room card to the search results.
   * @param {object} room - a JSON object providing the room's information
   */
  function addOneRoom(room) {
    let roomCard = gen("div");
    roomCard.id = room.rid;
    roomCard.appendChild(genImage(room.shortname, room.name));

    let roomDescription = gen("div");
    roomDescription.appendChild(genTextElement("p", room.city));
    roomDescription.appendChild(genTextElement("p", room.name));

    let button = genTextElement("button", "Room Details");
    button.addEventListener("click", openRoomInfoModal);
    roomDescription.appendChild(button);

    roomCard.append(roomDescription);
    id("room-types").appendChild(roomCard);
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
   * @returns {object} New DOM object for given HTML tag.
   */
  function genTextElement(tagName, text) {
    let element = gen(tagName);
    element.textContent = text;

    return element;
  }

  /**
   * Handle any errors when failed to fetch all rooms' information from the database.
   * @param {string} error - an error message
   */
  function handleAllError(error) {
    let alert = qs("#room-types .alert");
    displayError(alert, error);
  }

  /** ------------------------------ Open room info modal  ------------------------------ */

  /**
   * Display the room information modal.
   */
  function openRoomInfoModal() {
    let roomId = this.parentNode.parentNode.id;
    roomDetails(roomId);
    toggleHidden(id("room-info"));
  }

  /**
   * to fetch the information about specific room type.
   * @param {string} rid - the room's rid
   */
  function roomDetails(rid) {
    fetch("/room/" + rid)
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
  }

  /**
   * Add room's highlights.
   * @param {object} res - a JSON of room's information.
   */
  function addHighlight(res) {
    let ul = qs("#room-info ul");

    ul.appendChild(genLi("Sleeps" + res.capacity));

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

  /** ------------------------------ Slide Show ------------------------------ */

  /**
   * Automatically play the next side.
   */
  function autoSlideshow() {
    timeId = setInterval(() => {
      changeSlide(true);
    }, SLIDESHOW_INTERVAL);
  }

  /**
   * Reset the auto slideshow and display the next slide if isNext is true,
   * otherwise display the previous slide.
   * @param {boolean} isNext - if true, play the next slide, otherwise play
   * the previous slide.
   */
  function slideshow(isNext) {
    clearInterval(timeId);
    changeSlide(isNext);

    // reset the time interval
    autoSlideshow();
  }

  /**
   * Display the next slide if isNext is true, otherwise display the previous slide.
   * @param {boolean} isNext - if true, play the next slide, otherwise play
   * the previous slide.
   */
  function changeSlide(isNext) {
    let images = qsa("#hotel-info img");
    let current = qs("#hotel-info img:not(.hidden)");
    toggleHidden(current);

    if (isNext && current.nextElementSibling) {
      toggleHidden(current.nextElementSibling);
    } else if (isNext) {
      toggleHidden(images[0]);
    } else if (current.previousElementSibling) {
      toggleHidden(current.previousElementSibling);
    } else {
      toggleHidden(images[images.length - 1]);
    }
  }

  /** ------------------------------ Modify Layout  ------------------------------ */

  /**
   * Changes the layout of the room information section between grid to list.
   */
  function modifyLayout() {
    id("room-types").classList.toggle("grid");
    id("room-types").classList.toggle("list");
  }

  /**
   * Disables the button modifying the layout if window width is less and equal to 600px.
   * Enable the button if the window is larger than 600px.
   * @param {object} button - HTML button object
   */
  function layOut() {
    let button = qs("#modify-layout button");
    if (window.innerWidth <= MIN_WINDOW_WIDTH) {
      disableButton(button);
    } else {
      enableButton(button);
    }
  }

  /** ------------------------------ Search and save  ------------------------------ */

  /**
   * Search rooms that qualify the requirements
   */
  function search() {
    let params = new FormData(id("edit-stay"));

    fetch("/search", {method: "POST", body: params})
      .then(statusCheck)
      .then(res => res.json())
      .then(saveSearchResults)
      .catch(handleSearchError);
  }

  /**
   * Save the search results and query values into the session cookies.
   * Go the the selection page.
   * @param {object[]} res - an array of JSON
   */
  function saveSearchResults(res) {
    window.sessionStorage.setItem("results", JSON.stringify(res));
    saveSearchValues();
    window.location.href = "selection.html";
  }

  /**
   * Save the search queries to the session cookies.
   */
  function saveSearchValues() {
    SEARCH_KEYS.forEach(key => window.sessionStorage.setItem(key, id(key).value));
  }

  /**
   * Handle the error when failed to search from the database.
   * @param {string} error - the error message
   */
  function handleSearchError(error) {
    let alert = qs("#edit-stay .alert");
    displayError(alert, error);
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
   * Add the error message to the given alert object.
   * Display the error message.
   * @param {object} alert - a HTML DOM object with the class alert
   * @param {error} error error message
   */
  function displayError(alert, error) {
    alert.textContent = error;
    removeClass(alert, "hidden");
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