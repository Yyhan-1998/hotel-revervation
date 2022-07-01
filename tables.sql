CREATE TABLE "hotel" (
	"hid"	INTEGER NOT NULL,
	"city"	VARCHAR(20) NOT NULL,
	"address"	VARCHAR(255) NOT NULL,
	"tel"	INTEGER NOT NULL,
	PRIMARY KEY("hid" AUTOINCREMENT)
)

CREATE TABLE "room" (
	"rid"	INTEGER NOT NULL,
	"name"	VARCHAR(20) NOT NULL UNIQUE,
	"description"	TEXT NOT NULL,
	"capacity"	INTEGER NOT NULL,
	"hid"	INTEGER NOT NULL,
	"count"	INTEGER NOT NULL,
	"price"	INTEGER NOT NULL,
	"bed"	INTEGER NOT NULL,
	"highlights"	TEXT,
	"shortname"	TEXT,
	FOREIGN KEY("hid") REFERENCES "hotel"("hid"),
	PRIMARY KEY("rid" AUTOINCREMENT)
)

CREATE TABLE "user" (
	"username"	VARCHAR(20) NOT NULL,
	"password"	VARCHAR(255) NOT NULL,
	"firstName"	VARCHAR(30) NOT NULL,
	"lastName"	VARCHAR(30) NOT NULL,
	"phone"	VARCHAR(20) NOT NULL,
	"email"	VARCHAR(30) NOT NULL,
	"address"	VARCHAR(50) NOT NULL,
	"address2"	VARCHAR(50),
	"zipcode"	VARCHAR(10) NOT NULL,
	PRIMARY KEY("username")
)

CREATE TABLE "payment" (
	"pid"	INTEGER NOT NULL,
	"name"	VARCHAR(50) NOT NULL,
	"number"	VARCHAR(50) NOT NULL UNIQUE,
	"month"	VARCHAR(10) NOT NULL,
	"year"	VARCHAR(10) NOT NULL,
	"code"	VARCHAR(10) NOT NULL,
	PRIMARY KEY("pid")
)

CREATE TABLE "orderCreate" (
	"oid"	INTEGER NOT NULL,
	"username"	VARCHAR(20) NOT NULL,
	"city"	VARCHAR(20) NOT NULL,
	"createdTime"	DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
	"startDate"	DATE NOT NULL,
	"endDate"	DATE NOT NULL,
	"totalPaid"	INTEGER NOT NULL,
	"status"	VARCHAR(20) NOT NULL,
	"rid"	INTEGER NOT NULL,
	FOREIGN KEY("rid") REFERENCES "room"("rid"),
	FOREIGN KEY("username") REFERENCES "user"("username"),
	PRIMARY KEY("oid" AUTOINCREMENT)
)