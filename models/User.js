const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {type: String, required: true },
  email: {type: String, required: true },
  books: { type: Array, required: true , default: [] },
  currentBookID:  { type: String, required: false , default: "ID"},
}, {
  timestamps: true,
});



const User = mongoose.model('User', UserSchema, "users");



module.exports = User;