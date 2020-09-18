
const router = require('express').Router();

let User = require('../models/User');


router.route('/login').post((req, res) => {
  let { user: {username, email, password}, isSignIn, isSignUp } = req.body

  if (isSignIn) {
    console.log("Signing In", username, password )
    User.findOne({ username, password })
      .then(user => {
        console.log('Result: ', user)
        res.json(user)
      })
      .catch((err) => console.log(err))
  }
  if (isSignUp && email) {
    console.log("Signing Up")
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
          .then(() => res.json(user))
          .catch(() => res.status(500).send('Wrong User Info'))
      }
    

  }
})


router.route('/update-current').post((req, res) => {
  let { currentBookID, userID } = req.body

  User.findById(userID)
    .then((user) => {
      if (user) {
        user.currentBookID = currentBookID
        console.log(user)
        user.save()
          .then(() => res.send('Current Book Updated'))
      }
    })
});

module.exports = router;

