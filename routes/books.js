const router = require('express').Router();

let Book = require('../models/Book');



router.route('/').get((req, res) => {
    Book.find()
        .then(books => {
          res.json(books.reverse())
        })
        .catch(err => res.send(err))

});
router.route('/:id').get((req,res) => {
    Book.findById(req.params.id)
      .then(book => res.json(book))
})
router.route('/add').post((req, res) => {
    let {userID, title, author, chapter, chapters, cover, time} = req.body

    const newBook = new Book({
        userID,
        title,
        author,
        chapter,
        chapters,
        cover,
        time
      });
      newBook.save()
        .then(book => res.json({book}))

});
router.route('/:id').delete((req, res) => {
    Book.findByIdAndDelete(req.params.id)
      .then(() => console.log('book deleted'))
      .catch(() => console.log('book not deleted'))

  });
router.route('/update-time/:id').post((req, res) => {
    const {time} = req.body

    Book.findById(req.params.id)
    .then(Book => {
      Book.time = time
      Book.save()
        .then(() => res.json('Book time updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));

  });
router.route('/update-chapter/:id').post((req, res) => {
    const {chapter} = req.body
    Book.findById(req.params.id)
    .then(Book => {
      Book.chapter = chapter
      console.log(Book)
      Book.save()
        .then(() => res.json('Book chapter updated'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));

  });


module.exports = router;

