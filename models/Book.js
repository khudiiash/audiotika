const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = new Schema({
  userID: {type: String, required: true },
  title: {type: String, required: true },
  author: {type: String, required: true },
  chapter: { type: Number, required: true },
  chapters: { type: Number, required: true },
  cover: { type: String, required: false },
  time: { type: Number, required: false },
}, {
  timestamps: true,
});

const Book = mongoose.model('Book', BookSchema, "books");

module.exports = Book;