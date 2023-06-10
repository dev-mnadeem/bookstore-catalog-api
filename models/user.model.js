'use strict';

const mongoose = require('mongoose');

/**
 * A Wookie Books account.
 *
 * `authorPseudonym` is the pen name a book is published under; the assignment
 * calls for it on the custom user model. `salt` is a per-user value mixed into
 * the password before bcrypt hashing.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      unique: true,
      index: true,
    },
    authorPseudonym: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    salt: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
