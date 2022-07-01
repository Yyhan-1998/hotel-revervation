# Husky Hotel API Documentation
The Husky Hotel API provides information about all rooms in hotel, get information of a specific room type, get users' information, insert order to database, get users' order information, check the card information is correct or not.

## Get information of all rooms
**Request Format:** /all

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Return JSON format data of all rooms information which includes roomID, room name, room shortname and city.

**Example Request:** /all

**Example Response:**
```json
[
  {
    "rid": 1001,
    "name": "King Executive",
    "shortname": "king-executive",
    "city": "Seattle"
  },
  {
    "rid": 1002,
    "name": "Twin Deluxe",
    "shortname": "twin-deluxe",
    "city": "Seattle"
  },
  {
    "rid": 1003,
    "name": "Twin Executive",
    "shortname": "twin-executive",
    "city": "Seattle"
  },
  ...
]
```

**Error Handling:**
- N/A

## Get information of a specific room 
**Request Format:** /room/:rid

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a room ID, it will return a JSON format data with the information of the room. Only the room id exist in the database is valid. 

**Example Request:** /room/2002

**Example Response:**
```json
{
  "rid": 2002,
  "name": "Ling Kong",
  "description": "One king size double bed, no extra bed, maximum double occupancy. 62-73 square meters. The view is better. Butler service. Crystal desk. Simmons mattress. Walk-in cloakroom and butler cabinet. Double basin. Luxury bath products. Lobby Lounge courtesy. Happy evening at Yi Bar. Some soft drinks at the minibar are free.",
  "capacity": 2,
  "hid": 2,
  "count": 8,
  "price": 220,
  "bed": 1,
  "highlights": "Hot Tub,Window,Landury",
  "shortname": "ling-kong"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If passed in an invalid room ID, returns an error with the message: `Room does not exist.`


## Insert the new user information to database
**Request Format:** /user/signup endpoint with POST parameters of `username`, `firstName`, `lastName`, `phone`, `email`, `address`
`address2`, `zipcode`, `password`, `confirm`

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Insert the user information with the hashed password to the database. The password and confirmed password must be same. And the user must not exist in the database. Once successfully insert the new user, it will return a text format information with the new username.

**Example Request:** /user/signup with POST parameters of `username = yiyang`, `firstName=Yang`, `lastName=Yi`, `phone=3216789304`, `email=yiyang@uw.edu`, `address=4535 12th AVE NE`, `address2=E134`, `zipcode=98105`, `password=yIyang123`, `confirm=yIyang123`

**Example Response:**
```
yiyang
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the password is not equal to confirmed password, returns an error with the message: `Confirmed password must equal to the password.`
  - If the username has already exist, returns an error with message: `User already existed.`


## Find whether username and password matches
**Request Format:** /user/login endpoint with POST parameters of `username` and `password`

**Request Type**: POST

**Returned Data Format**: Plain Text

**Description:** Given `username` and `password` to send, the API will first check whether the username is valid which means `username` has already exists in the database. Then check whether `username` and `password` matches with our database, if matches it will return the `username`.

**Example Request:** /user/login with POST parameters of `username=yanyao` and `password=Yanyao123`

**Example Response:**
```
yanyao
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If missing parameter, returns an error with the message `Missing one or more of the required params.`
  - If the `username` is valid, returns an error with the message `Invalid Username.`
  - If the `username` and `password` do not match, returns an error with the message `Sorry, the password does not match our record, please try again.`


## Search rooms
**Request Format:** /search endpoint with POST parameters of `destination`, `start`, `end`, `number-of-guest`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given the parameters `city`, `checkIn`, `checkOut` and `person`, it will search rooms that qualify the requirement. API will first check whether `city` is valid or not, only the valid city is that exist in the database. After searching room, it will return the room information in JSON format. 

**Example Request:** /search with POST parameters of `destination=Seattle`, `start=2021-12-24`, `end=2021-12-25`, `number-of-guest=3`

**Example Response:**
```json
[
  {
    "rid": 1001,
    "name": "King Executive",
    "shortname": "king-executive",
    "price": 150,
    "bed": 1,
    "city": "Seattle",
    "hid": 1
  },
  {
    "rid": 1002,
    "name": "Twin Deluxe",
    "shortname": "twin-deluxe",
    "price": 155,
    "bed": 2,
    "city": "Seattle",
    "hid": 1
  }
  ...
]

```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If missing one or more parameters, an error is returned with the message: `Missing one or more of the required params.`
  - If the `destination` is invalid, an error is returned with: `Sorry we do not offer hotel service at this city. Please try another city. Thank you for understanding.`
  - If there is no room qualify the requirements, an error is returned with: `Sorry. All rooms are currently booked for this time period.`



## Return the hotel information
**Request Format:** /hotel/:city

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a valid `city` name, it will return a JSON format informarion about the hotel in that city. 

**Example Request:** /hotel/Seattle

**Example Response:**
```json
{
  "hid": 1,
  "city": "Seattle",
  "address": "4555 12th AVE NE",
  "tel": " +1(206)5678956"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the `city` is invalid, returns an error with the message: `Sorry we do not offer hotel service at this city. Please try another city. Thank you for understanding.`


## Check card information
**Request Format:** /payment endpoint with POST parameters of `name`, `number`, `month`, `year`, `code`

**Request Type:** POST

**Returned Data Format**: Plain Text

**Description:** Given the card information, check the information of card is right or not. Once the information matches, returns a text format information.

**Example Request:** /payment  with POST parameters of `name=Bella`, `number=1098765432101234`, `month=09`, `year=26`, `code=124`

**Example Response:**
```
success!!
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the information of card is incorrect, returns an error with the message: `Sorry, the information of card is not true.`


## Insert order information
**Request Format:** place-order/:username/:city/:rid/:start/:end/:price

**Request Type:** GET

**Returned Data Format**: Plain Text

**Description:** Given the information, it will check whether the user has conflicting order, which means if user A has an order that check in date is `2021-12-23` and check out date is `2021-12-25`, if user A also want to submit an order which check in date is `2021-12-23` and check out date is `2021-12-24`, the order cannot submit successfully. If user do not have conflicting order, it will insert the order into database and return confirmation number.


**Example Request:** /place-order/yanyao/Seattle/1006/2021-12-23/2021-12-24/375

**Example Response:**
```
8008
```

**Error Handling:**
- N/A


## Get user information
**Request Format:** /userInfo/:username

**Request Type**: GET

**Returned Data Format**: JSON

**Description:** Given `username` to send, the API will search the information of that user, if the `username` is valid which means the username exists in database, returns a JSON format information includes username, user email, user phone number, user address and user zipCode.

**Example Request:** /userInfo/yanyao

**Example Response:**
```json
{
  "username": "yanyao",
  "email": "hanyy89090@outlook.com",
  "phone": "2067896537",
  "address": "3545 17th AVE NE",
  "zipcode": "98105"
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If the `username` is valid, returns an error with the message `The user is not exist.`


## Search user orders
**Request Format:** /order/:user

**Request Type**: GET

**Returned Data Format**: JSON

**Description:** Given the parameters `username`, it will search the orders of user. After searching room, it will return a JSON format information includes order create time, order ID, hotel city, check in date, check out date, titalPaid and order status.

**Example Request:** /order/yanyao

**Example Response:**
```json
[
  {
    "createdTime": "2021-12-11 15:42:58",
    "oid": 8001,
    "city": "Seattle",
    "startDate": "2021-12-16",
    "endDate": "2021-12-20",
    "totalPaid": 350,
    "status": "Confirmed"
  },
  {
    "createdTime": "2021-12-11 15:43:30",
    "oid": 8002,
    "city": "Seattle",
    "startDate": "2021-12-14",
    "endDate": "2021-12-16",
    "totalPaid": 350,
    "status": "Confirmed"
  },
  ......
]
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If user does not have any order, returns an error with the message `Sorry, we do not have your order record.`

