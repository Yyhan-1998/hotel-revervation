/**
 * Last Updated Date: December 11, 2021
 * Student 1: Travis Xie
 * Section: AE, TA: Tim Mandzyuk, Nikola Bojanic
 *
 * Author 2: Yanyao Han
 * Section AA: TA: Sonia Saitawdekar
 *
 * This is the Node backend file to manage the clients' requests. It responds to user's request and
 * sends back the corresponding results. See APIDOC.md for more details.
 */
"use strict";

// load module
const express = require("express");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const multer = require("multer");
const bcrypt = require('bcrypt');

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

// local host number
const LOCAL_PORTAL_NUMBER = 8000;

// salt rounds for the bcrypt hash;
const SALT_ROUNDS = 10;

// error code
const INVALID_PARAM_ERROR = 400;
const SERVER_ERROR = 500;

// error messages
const SERVER_ERROR_MSG = "An error occurred on the server. Try again later.";
const PARAMS_MISSING = "Missing one or more of the required params.";

const USER_ALREADY_EXIST_MSG = "User already existed!";
const PASSWORD_NOT_EQUAL_MSG = "Confirmed password must equal to the password!";
const USER_NOT_EXIST = "User does not exist!";
const PASSWORD_NOT_TRUE = "Invalid password! Please try again.";
const INVALID_CARD = "Please provide a valid card. ";
const NO_HOTEL_SERVICE = "Sorry! We do not offer hotel service at this city. \
Please try another city. Thank you for understanding.";
const NO_AVAILABLE_ROOM = "Sorry. All rooms are currently booked for this time period.";
const NO_SUCH_ROOM = "Room does not exist.";

/**
 * Get all rooms' information from the database. Send back the results in JSON format.
 */
app.get("/all", async function(req, res) {
  try {
    let db = await getDBConnection();
    let query = "SELECT rid, name, shortname, city \
                 FROM room, hotel \
                 WHERE room.hid = hotel.hid \
                 ORDER BY rid;";
    let allRooms = await db.all(query);
    await db.close();

    res.json(allRooms);
  } catch (error) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * Get the information of a specific room and return a JSON type data with
 * all information of the room. Return error message if the room does not exist
 * in the database.
 */
app.get("/room/:rid", async function(req, res) {
  let rid = req.params.rid;

  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM room WHERE rid = ?";
    let roomInfo = await db.all(query, parseInt(rid));
    await db.close();

    if (roomInfo.length === 0) {
      res.type("text");
      res.status(INVALID_PARAM_ERROR).send(NO_SUCH_ROOM);
    } else {
      res.json(roomInfo[0]);
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * Insert the new user information with the hashed password to the database. Input
 * password must equal to the confirmed password. And the username must have not
 * existed yet. Send back the username in text.
 */
app.post("/user/signup", async (req, res) => {
  let params = {"username": "", "firstName": "", "lastName": "", "phone": "",
    "email": "", "address": "", "address2": "", "zipcode": ""};

  Object.keys(params).forEach(function(key) {
    if (req.body[key]) {
      params[key] = req.body[key];
    }
  });

  let password = req.body.password;
  let confirm = req.body.confirm;

  res.type("text");

  if (password !== confirm) {
    res.status(INVALID_PARAM_ERROR).send(PASSWORD_NOT_EQUAL_MSG);
  } else {
    try {
      let userInfo = await getUserInfo(params["username"]);

      // user does not exist yet
      if (userInfo.length === 0) {
        await createNewUser(params, password);
        res.send(req.body.username);
      } else {
        res.status(INVALID_PARAM_ERROR).send(USER_ALREADY_EXIST_MSG);
      }
    } catch (error) {
      res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Responds to user's log in. If the username and password must match the database.
 * If matches, send back the username in text.
 */
app.post("/user/login", async function(req, res) {
  let username = req.body.username;
  let password = req.body.password;
  res.type("text");

  if (!username || !password) {
    res.status(INVALID_PARAM_ERROR).send(PARAMS_MISSING);
  } else {
    try {
      let usernameQuery = await getUserInfo(username);
      if (usernameQuery.length !== 0) {
        let compare = await bcrypt.compare(password, usernameQuery[0].password);
        if (!compare) {
          res.status(INVALID_PARAM_ERROR).send(PASSWORD_NOT_TRUE);
        } else {
          res.send(username);
        }
      } else {
        res.status(INVALID_PARAM_ERROR).send(USER_NOT_EXIST);
      }
    } catch (error) {
      res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Search the rooms that match the user's quires. Send back an array of JSON of
 * room's information. Or send back the error message if any error occurs.
 */
app.post("/search", async function(req, res) {
  let city = req.body.destination;
  let checkIn = req.body.start;
  let checkOut = req.body.end;
  let person = req.body["number-of-guest"];

  if (!city || !checkIn || !checkOut || !person) {
    res.type("text");
    res.status(INVALID_PARAM_ERROR).send(PARAMS_MISSING);
  } else {
    try {
      let hotelInfo = await getHotelInfo(city);
      if (hotelInfo.length === 0) {
        res.type("text");
        res.status(INVALID_PARAM_ERROR).send(NO_HOTEL_SERVICE);
      } else {
        let roomResult = await searchRoom(city, checkIn, checkOut, person);
        if (roomResult.length === 0) {
          res.type("text");
          res.status(INVALID_PARAM_ERROR).send(NO_AVAILABLE_ROOM);
        } else {
          res.json(roomResult);
        }
      }
    } catch (error) {
      res.type("text");
      res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
    }
  }
});

/**
 * Get the hotel's information that are in the query city. Send backs the result
 * in JSON.
 */
app.get("/hotel/:city", async (req, res) => {
  try {
    let results = await getHotelInfo(req.params.city);

    if (results.length !== 0) {
      res.json(results[0]);
    } else {
      res.type("text");
      res.status(INVALID_PARAM_ERROR).send(NO_HOTEL_SERVICE);
    }
  } catch (error) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }

});

/**
 * An endpoint to find out whether the card information the user inputs
 * matches the database or not. Send back the results in text. If matched, return
 * "success".
 */
app.post("/payment", async function(req, res) {
  let cardParams = ["card-name", "card-number", "month", "year", "security"];
  let params = [];

  cardParams.forEach(param => params.push(req.body[param]));
  res.type("text");

  try {
    let db = await getDBConnection();
    let sql = "SELECT * FROM payment WHERE name = ? AND number = ? AND month = ? " +
    "AND year = ? AND code = ?";

    let cardResult = await db.all(sql, params);
    await db.close();

    if (cardResult.length === 0) {
      res.status(INVALID_PARAM_ERROR).send(INVALID_CARD);
    } else {
      res.send("success!!");
    }
  } catch (error) {
    res.status(SERVER_ERROR).send(error);
  }
});

/**
 * Place an order with the provided information. Insert the new order into the database
 * if the user does not have a conflict order. Send back the order confirmation ID in a
 * text format.
 */
app.get("/place-order/:username/:city/:rid/:start/:end/:price", async function(req, res) {
  let username = req.params.username;
  let city = req.params.city;
  let rid = req.params.rid;
  let start = req.params.start;
  let end = req.params.end;
  let price = req.params.price;

  res.type("text");

  try {
    let isConflict = await checkOrderConflict(username, start, end);
    if (isConflict) {
      res.send("0");
    } else {
      let orderInfo = [username, city, rid, start, end, price, "completed"];
      let confirmationNum = await insertNewOrder(orderInfo);
      res.send(confirmationNum);
    }
  } catch (error) {
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * Get the quired user's information. Send back the results in JSON.
 */
app.get("/userInfo/:username", async function(req, res) {
  let username = req.params.username;
  try {
    let db = await getDBConnection();
    let query = "SELECT username, email, phone, address, zipCode FROM user WHERE username= ? ";
    let userResult = await db.get(query, username);
    await db.close();

    if (userResult.length === 0) {
      res.type("text");
      res.status(INVALID_PARAM_ERROR).send(USER_NOT_EXIST);
    } else {
      res.json(userResult[0]);
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * Get all orders of the given user. it will send a json type information.
 */
app.get("/order/:user", async function(req, res) {
  let username = req.params.user;
  try {
    let db = await getDBConnection();
    let query = "SELECT createdTime, oid, h.city, startDate, endDate, totalPaid, status FROM " +
    "orderCreate o, hotel h WHERE o.city = h.city AND username = ? ORDER BY oid DESC;";
    let orderResult = await db.all(query, username);
    await db.close();

    res.json(orderResult);
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/** ------------------------------ Helper Functions  ------------------------------ */

/**
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "husky.db",
    driver: sqlite3.Database
  });

  return db;
}

/**
 * Return the rooms that matches the search quires.
 * @param {string} city - the name of the city
 * @param {object} checkIn - the check in date
 * @param {object} checkOut - the check out date
 * @param {number} person - the number of person
 * @return {Promise<object[]>} return the rooms in an array of JSON
 */
async function searchRoom(city, checkIn, checkOut, person) {
  let db = await getDBConnection();
  let query = "SELECT T1.rid, T1.name, T1.shortname, T1.price, T1.bed, T1.city, T1.hid \
                 FROM (SELECT * \
                       FROM room AS R JOIN hotel AS H ON R.hid = H.hid \
                       WHERE H.city = ? AND R.capacity >= ?) AS T1 \
                       LEFT OUTER JOIN \
                      (SELECT o.rid, COUNT(*) AS cnt \
                       FROM hotel AS h JOIN orderCreate AS o ON h.city = o.city \
                       WHERE h.city = ? AND((startDate BETWEEN ? AND ?) \
                        OR (endDate BETWEEN ? AND ?) OR (startDate <= ? AND endDate >=?) )) AS T2 \
                       ON T1.rid = T2.rid \
                WHERE T1.count > T2.cnt OR T2.cnt IS NULL \
                ORDER BY T1.price;";

  let params = [city, person, city, checkIn, checkOut, checkIn, checkOut, checkIn, checkOut];
  let roomSelection = await db.all(query, params);
  await db.close();

  return roomSelection;
}

/**
 * Hash the password and return the hashing.
 * @param {string} password - the password string
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(password) {
  let hashed = await bcrypt.hash(password, SALT_ROUNDS);
  return hashed;
}

/**
 * Get and return the given user's information from the database.
 * @param {string} username - the username string
 * @returns {Promise<array>} return an array of JSON objects containing the
 * given user's information.
 */
async function getUserInfo(username) {
  try {
    let db = await getDBConnection();
    let sql = "SELECT * FROM user WHERE username = ?";
    let result = await db.all(sql, [username]);
    await db.close();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Insert the given user's information into the database.
 * @param {array} params - a list of strings of the user's information.
 * @param {string} password - a string of the password.
 */
async function createNewUser(params, password) {
  try {
    let db = await getDBConnection();
    let sql = "INSERT INTO user (username, firstName, lastName, phone, email, address, address2, " +
    "zipcode, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    // add the hashed password
    params["password"] = await hashPassword(password);

    let values = [];
    for (let key in params) {
      values.push(params[key]);
    }

    await db.run(sql, values);
    await db.close();

  } catch (error) {
    throw error;
  }
}

/**
 * Get the given city's hotel information
 * @param {string} city - the city name user queries
 * @returns {Promise<object[]>} return an array of JSON object of the hotel's
 * information.
 */
async function getHotelInfo(city) {
  let db = await getDBConnection();
  let query = "SELECT * FROM hotel WHERE city = ?";
  let results = await db.all(query, city);
  await db.close();
  return results;
}

/**
 * Check whether the use has another order in the same period.
 * @param {string} username - the username
 * @param {DATE} start - check in date
 * @param {DATE} end - check out date
 * @returns {Promise<boolean>} return true if there is a conflicted order.
 */
async function checkOrderConflict(username, start, end) {
  let db = await getDBConnection();
  let query = "SELECT * \
                FROM orderCreate \
                WHERE username=? AND ((startDate > ? \
                AND startDate < ?) OR (endDate > ? AND endDate<= ?) \
                OR(startDate <= ? AND endDate >=?));";

  let result = await db.all(query, [username, start, end, start, end, start, end]);
  await db.close();

  return result.length > 0;
}

/**
 * Insert the new order into the database and return the confirmation number
 * @param {string[]} orderInfo - an array of string of order information
 * @returns {Promise<string>} - return the order confirmation number
 */
async function insertNewOrder(orderInfo) {
  let db = await getDBConnection();
  let query = "INSERT INTO orderCreate(username, city, rid, startDate, endDate, \
               totalPaid, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

  let result = await db.run(query, orderInfo);
  await db.close();

  return result.lastID.toString();
}

app.use(express.static("public"));

const PORT = process.env.PORT || LOCAL_PORTAL_NUMBER;
app.listen(PORT);
