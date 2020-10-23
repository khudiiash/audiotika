const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const app = express()
const ss = require('socket.io-stream')
const path = require('path')
const findAuthor = require('./utils/findAuthor')
const findTitle = require('./utils/findTitle')


const audiodir = path.join(__dirname, "audio")

const mongoose = require('mongoose');

app.use(cors())
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, "audio")))


const uri = "mongodb+srv://Dmytro:149600earthsun@cluster0-mwooj.mongodb.net/audioteka?retryWrites=true&w=majority";
mongoose.connect(process.env.MONGODB_URI || uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB connected");
})


if (!fs.existsSync("audio")){
    fs.mkdirSync("audio");
}

app.use('/books', require('./routes/books'));
app.use('/user', require('./routes/user'));


if (process.env.NODE_ENV === 'production') {
    app.use(express.static( 'client/dist' ))
    app.get('*', (req,res) => {
        res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
    })

}

const server = app.listen(process.env.PORT || 5000, () => console.log('Up and Running'))

const io = require('socket.io').listen(server)

io.on('connection', function (socket) {
    audio = "";
    title = "";
    cover = "";
    author = "";
    chapters = 0;
    chapter = 0;


    function handleTorrent(torrent, title, author, forFuture) {
        let torrentFiles = torrent.files.filter((f, i) => {
            if (/\.mp3|\.aac|\.wav/.test(f.name)) return f
        })
        var customSort = function (a, b) {
            return (Number(a.name.match(/(\d+)/g)[0]) - Number((b.name.match(/(\d+)/g)[0])));
        }
        torrentFiles = torrentFiles.sort(customSort);
        chapter = data.chapter
        console.log('Torrent Files: ',torrentFiles.length)
        torrentFiles.forEach(function (file, index) {
            if (index === data.chapter - 1) {
                if (fs.existsSync(path.join(audiodir, torrentID, file.name))) {
                    console.log('File Exits, Sending')
                    chapters = torrent.files.filter(f => /\.mp3|\.aac|\.wav/.test(f.name)).length
                    console.log("Sending", title, author, chapter, chapters, forFuture)
                    socket.emit('audio-loaded', {fileName: file.name, torrentID, title, author, chapter, chapters, forFuture})
                } else {
                    console.log('File Does Not Exist, Writing')
                    if (!fs.existsSync(path.join(audiodir, torrentID))) {
                        console.log("creating folder "+path.join(audiodir, torrentID))
                        fs.mkdirSync(path.join(audiodir, torrentID))
                    }
                    const stream = file.createReadStream();
                    const audioPath = path.join(audiodir, torrentID, file.name)
                    const writer = fs.createWriteStream(audioPath);
                    console.log('Start Writing')
                    stream.on('data', function (data) {
                        writer.write(data);
                    });
                    stream.on('end', () => {
                            chapters = torrent.files.filter(f => /\.mp3|\.aac|\.wav/.test(f.name)).length
                            console.log("Sending", bookTitle, bookAuthor, chapter, chapters, forFuture)
                            socket.emit('audio-loaded', {fileName: file.name, torrentID, title: bookTitle, author: bookAuthor, chapter, chapters, forFuture})
                        
                    })
                }
                
            }
        })
    }

    socket.on('search-book', function(data) {
        const RutrackerApi = require('rutracker-api');
        const rutracker = new RutrackerApi();

        rutracker.login({ username: process.env.RUNAME || 'Khudiiash', password: process.env.RUPASS || '149600earthsun' })
            .then(() => rutracker.search({ query: data.title, sort: 'seeds' }))
            .then(torrents => {
                torrents = torrents.filter(t => /Аудио/.test(t.category) && / -| –/.test(t.title))
                let searchResult = torrents.map(t => {
                    console.log(t.title)
                    let book_title = findTitle(t.title)
                    let book_author = findAuthor(t.title)
                    let {id, size, seeds} = t;
                    return {id, title: book_title, author: book_author, torrent: t.title, size, seeds}
                })
                socket.emit('search-result', {result: searchResult})
            })
    })

    socket.on('download-chapter', function (data) {
        chapter = data.chapter
        let torrentID = data.torrentID
        let forFuture = data.forFuture
        let bookTitle = data.title
        let bookAuthor = data.author;
        playing = false;
        audio = "";
        chapters = 0;
        console.log('downloading', data.title, 'chapter:', chapter, 'forFuture', forFuture)
        const RutrackerApi = require('rutracker-api');
        const rutracker = new RutrackerApi();
        rutracker.login({ username: process.env.RUNAME || 'Khudiiash', password: process.env.RUPASS || '149600earthsun' })
        .then(() => {
            console.log('Getting Magnet URI')
            rutracker.getMagnetLink(torrentID)
            .then(URI => {
                var WebTorrent = require('webtorrent')
                var client = new WebTorrent()
                if (client.torrents.filter(t => t.id === torrentID).length > 0) {
                    console.log('Getting Torrent in CLIENT')
                    handleTorrent(client.get(torrentID), bookTitle, bookAuthor, forFuture)
                } else {
                    console.log('Adding URI to CLIENT')
                    client.add(URI, function (torrent) {
                        handleTorrent(torrent, bookTitle, bookAuthor, forFuture)
                    })
                }
            }).catch(err => console.log("Magnet Link Error", err))
        })    
    })
     socket.on('delete-file', function ({filePath}) {
       try {
           fs.unlinkSync(filePath)
           console.log(filePath, 'successfuly deleted')
       } catch (err) {
           console.log(err)
           fs.readdir(audiodir, function(err, files) {
               if (!err) console.log(files)
               files.forEach(f => {
                   fs.readdir(f, (err, audios) => {
                        console.log(audios)
                   })
               })
           })
       }
    })
});






