const express = require('express')
const bodyParser = require('body-parser')
const https = require('https')
const iconv = require('iconv-lite')
const cheerio = require("cheerio")
const fs = require('fs')
const cors = require('cors')
const app = express()
const path = require('path')
const findAuthor = require('./utils/findAuthor')
const findTitle = require('./utils/findTitle')

let WebTorrent = require('webtorrent')
let client = new WebTorrent()


const audiodir = path.join(__dirname, "audio")

const mongoose = require('mongoose');
const { response } = require('express')

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
    fs.mkdirSync(path.join(__dirname, 'audio'));
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

    function getBookInfo(torrentID) {
        https.get('https://rutracker.org/forum/viewtopic.php?t='+torrentID, (res) => {
            res.pipe(iconv.decodeStream("win1251")).collect((err, body) => {
                if (err) throw err;
                let info = {}
                let matches = [...body.matchAll(/(?<=>)([^<]+)<\/span>:\s([^<]+)(?=<(?:br|hr|span))|(?<=<var class="postImg postImgAligned img-right" title=")([^"]+)/g)]
                matches.forEach(r => {
                    if (r[1] && r[2]) info[r[1]] = r[2];
                    if (r[3]) info['cover'] = r[3]
                })
                socket.emit('book-info-ready', info)
    
            })
        });
    }

    function handleTorrent({torrent, torrentID, title, author, chapter, forFuture}) {
        let torrentFiles = torrent.files.filter((f, i) => { 
            if (/\.mp3/.test(f.name)) return f
        })
        var customSort = function (a, b) {
            return (Number(a.name.replace(/\.mp3/,'').replace(/\D+/g, '')) - Number(b.name.replace(/\.mp3/,'').replace(/\D+/g, '')));
          }
        torrentFiles = torrentFiles.sort(customSort);
        torrentFiles.forEach(function (file, index) {
            if (index === chapter - 1) {
                if (fs.existsSync(path.join(audiodir, torrentID, file.name))) {
                    chapters = torrent.files.filter(f => /\.mp3/.test(f.name)).length
                    socket.emit('audio-loaded', {fileName: file.name, torrentID, title, author, chapter, chapters, forFuture})
                    console.log('Audio Ready')
                    getBookInfo(torrentID)
                } else {
                    if (!fs.existsSync(path.join(audiodir, torrentID))) {
                        fs.mkdirSync(path.join(audiodir, torrentID))
                    }
                    const stream = file.createReadStream();
                    const audioPath = path.join(audiodir, torrentID, file.name)
                    const writer = fs.createWriteStream(audioPath);
                    stream.on('data', function (data) {
                        writer.write(data);
                    });
                    stream.on('end', () => {
                        chapters = torrent.files.filter(f => /\.mp3/.test(f.name)).length
                        socket.emit('audio-loaded', {fileName: file.name, torrentID, title, author, chapter, chapters, forFuture})
                        console.log('Audio Ready')
                        getBookInfo(torrentID)
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
                    let book_title = findTitle(t.title)
                    let book_author = findAuthor(t.title)
                    let {id, size, seeds} = t;
                    let result = {id, title: book_title, author: book_author, torrent: t.title, size, seeds}
                    return result
                })
                console.log(searchResult)
                socket.emit('search-result', {result: searchResult})
            })
    })
    socket.on('download-chapter', function (data) {
        let chapter = data.chapter
        let torrentID = data.torrentID
        let forFuture = data.forFuture
        let bookTitle = data.title
        let bookAuthor = data.author;
        playing = false;
        audio = "";
        console.log('downloading', data.title, 'chapter:', chapter, 'forFuture', forFuture)
        const RutrackerApi = require('rutracker-api');
        const rutracker = new RutrackerApi();
        rutracker.login({ username: process.env.RUNAME || 'Khudiiash', password: process.env.RUPASS || '149600earthsun' })
        .then(() => {
            rutracker.getMagnetLink(torrentID)
            .then(URI => {
                if (client.torrents.filter(t => t.id === torrentID).length > 0) {
                    let torrent = client.torrents.find(t => t.id === torrentID)
                    handleTorrent({torrent, torrentID, title: bookTitle, author: bookAuthor, chapter, forFuture})
                } else {
                    try {
                        client.add(URI, function (torrent) {
                            torrent.id = torrentID
                            handleTorrent({torrent: torrent, torrentID, title: bookTitle, author: bookAuthor, chapter, forFuture})
                        })
                    } catch (err) {
                        console.log(err)
                    }
                    
                }
            }).catch(err => console.log("Magnet Link Error", err))
        })    
    })
     socket.on('delete-file', function ({torrentID, fileName}) {
       try {
           fs.readdir(path.join(audiodir,torrentID), (err, files) => {
                if (!err) {
                    files.forEach(file => {
                        if (file === fileName) {
                            fs.unlink(path.join(audiodir,torrentID,fileName), function(err) {
                                if (!err) console.log(`File ${fileName} is deleted`)
                            })
                        } else {
                            console.log(file)
                        }
                    })
                } else {
                    console.log(path.join(audiodir,torrentID), " does not exist")
                }
           })
       } catch (err) {
           console.log(err)
       }
    })
});






