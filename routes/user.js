
const router = require('express').Router();

let User = require('../models/User');


router.route('/login').post((req, res) => {
  
  let { user: {username, email, password}, isSignIn, isSignUp } = req.body
  if (isSignIn) {

    User.findOne({ username: username, password: password })
      .then(user => {
        if (user) res.json(user)
        else res.status(500).send('Wrong username of password')
      })
      .catch((err) => console.log(err))
  }
  if (isSignUp && email) {
    User.findOne({ username, email })
      .then(user => {
        if (user) res.json(user)
        else createNewUser()
      })

      function createNewUser() {
        const newUser = new User({
          username,
          email,
          password,
          books: [],
        });
        newUser.save()
          .then((user) => res.json(user))
          .catch((err) => {console.log('failed to create user',newUser, err);res.status(500).send('Wrong User Info')})
      }
  }
})


router.route('/update-current').post((req, res) => {
  let { currentBookID, userID } = req.body

  User.findById(userID)
    .then((user) => {
      if (user) {
        user.currentBookID = currentBookID
        user.save()
          .then(() => res.send('Current Book Updated'))
      }
    })
});

module.exports = router;

