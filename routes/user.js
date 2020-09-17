
const router = require('express').Router();

let User = require('../models/User');


router.route('/login').post((req, res) => {
    let {name, email } = req.body
    User.findOne({email})
      .then((user) => {
        if (user) {
          console.log('found user, sending', user)
          res.json(user)
        }
        else {
          console.log('no such user, creating')
          const newUser = new User({
            name,
            email,
            books: [],
          });
          newUser.save()
            .then(() => res.json(user))
            .catch(err => res.json({msg: err}))
        }
    })
});

router.route('/update-current').post((req, res) => {
  let {currentBookID, userID} = req.body

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

