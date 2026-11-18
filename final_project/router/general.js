@'
const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE = 'http://localhost:5000';

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });
  if (users.find(u => u.username === username))
    return res.status(409).json({ message: "User already exists" });
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

public_users.get("/", (req, res) => {
  res.status(200).send(JSON.stringify(books, null, 4));
});

public_users.get("/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book)
              : res.status(404).json({ message: "Book not found" });
});

const findBy = (field, value) =>
  Object.entries(books)
    .filter(([, b]) => b[field].toLowerCase() === value.toLowerCase())
    .map(([isbn, b]) => ({ isbn, ...b }));

public_users.get("/author/:author", (req, res) => {
  const result = findBy("author", req.params.author);
  return result.length ? res.status(200).json(result)
                       : res.status(404).json({ message: "No books by that author" });
});

public_users.get("/title/:title", (req, res) => {
  const result = findBy("title", req.params.title);
  return result.length ? res.status(200).json(result)
                       : res.status(404).json({ message: "No books with that title" });
});

public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book.reviews)
              : res.status(404).json({ message: "Book not found" });
});

// ---------- Task 11: Axios with async/await and promise callbacks ----------
const getAllBooks = async () => {
  const response = await axios.get(BASE + "/");
  return response.data;
};

const getBookByISBN = (isbn) =>
  axios.get(BASE + "/isbn/" + isbn).then(response => response.data);

const getBooksByAuthor = async (author) => {
  const response = await axios.get(BASE + "/author/" + encodeURIComponent(author));
  return response.data;
};

const getBooksByTitle = (title) =>
  axios.get(BASE + "/title/" + encodeURIComponent(title)).then(response => response.data);

public_users.get("/async/books", async (req, res) => {
  try { res.status(200).json(await getAllBooks()); }
  catch (e) { res.status(500).json({ message: "Error fetching books" }); }
});

public_users.get("/async/isbn/:isbn", (req, res) => {
  getBookByISBN(req.params.isbn)
    .then(data => res.status(200).json(data))
    .catch(() => res.status(404).json({ message: "Book not found" }));
});

public_users.get("/async/author/:author", async (req, res) => {
  try { res.status(200).json(await getBooksByAuthor(req.params.author)); }
  catch (e) { res.status(404).json({ message: "No books by that author" }); }
});

public_users.get("/async/title/:title", (req, res) => {
  getBooksByTitle(req.params.title)
    .then(data => res.status(200).json(data))
    .catch(() => res.status(404).json({ message: "No books with that title" }));
});

module.exports.general = public_users;
'@ | Set-Content -Encoding utf8 router\general.js
