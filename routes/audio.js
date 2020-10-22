const router = require('express').Router();
const path = require('path')




router.route('/audio/*').get((req, res) => {
    let reqURL = req.originalUrl
    console.log(reqURL)
    console.log(path.join(__dirname, '../audio', reqURL))
    //res.sendFile(path.join(__dirname, '../audio', reqURL))

});
router.route('/:id').get((req,res) => {
    Book.findById(req.params.id)
      .then(book => res.json(book))
})
router.route('/add').post((req, res) => {
    let {userID, title, author, chapter, chapters, torrentID, cover, time} = req.body


    const newBook = new Book({
        userID,
        title,
        author,
        chapter,
        chapters,
        torrentID,
        cover,
        time
      });
      console.log(newBook)
      newBook.save()
        .then(book => res.json({book}))
        .catch(err => console.log(err))

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
      Book.save()
        .then(() => res.json('Book chapter updated'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));

  });
  router.route('/update-chapters/:id').post((req, res) => {
    const {chapters} = req.body
    Book.findById(req.params.id)
    .then(Book => {
      Book.chapters = chapters
      Book.save()
        .then(() => res.json('Book chapters updated'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));

  });


module.exports = router;

