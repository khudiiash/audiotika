const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const app = express()

const ss = require('socket.io-stream')
const path = require('path')
const findAuthor = require('./utils/findAuthor')
const findTitle = require('./utils/findTitle')
const fileExists = require('file-exists-promise')

const mongoose = require('mongoose');

app.use(cors())
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const uri = "mongodb+srv://Dmytro:149600earthsun@cluster0-mwooj.mongodb.net/audioteka?retryWrites=true&w=majority";
mongoose.connect(process.env.MONGODB_URI || uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB connected");
})

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
let audiodir;

io.on('connection', function (socket) {
    audio = "";
    title = "";
    cover = "";
    author = "";
    chapters = 0;
    chapter = 0;
    audiodir = path.join(__dirname, "audio")

    if (!fs.existsSync(audiodir)){
        fs.mkdirSync(audiodir);
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
                    let {id, size, seeds} = t
                    return {id, title: book_title, author: book_author, torrent: t.title, size, seeds}
                })
                console.log('search result', searchResult)
                socket.emit('search-result', {result: searchResult})
            })
        
    })

    socket.on('download-chapter', function (data) {
        title = data.title
        chapter = data.chapter
        let torrentID = data.torrentID
        let forFuture = data.forFuture
        playing = false;
        audio = "";
        author = "No Author";
        chapters = 0;
        console.log('downloading ', title, 'chapter: ', chapter, ' forFuture', forFuture)

        if (torrentID) console.log('Torrent ID: ', torrentID); else console.log('no torrent id')
        const RutrackerApi = require('rutracker-api');
        const rutracker = new RutrackerApi();


        rutracker.login({ username: process.env.RUNAME || 'Khudiiash', password: process.env.RUPASS || '149600earthsun' })
            .then(() => rutracker.search({ query: data.title, sort: 'seeds' }))
            .then(torrents => {

                torrents = torrents.filter(t => /Аудио/.test(t.category) && / -| –/.test(t.title))
                if (torrents.length) {
                    let torrent = torrents[0]
                    author = findAuthor(torrent.title);
                    title = findTitle(torrent.title); 

                    console.log('inside torrentID: ', torrentID)
                    console.log('inside data.torrentID: ',data.torrentID)


                    rutracker.getMagnetLink(torrentID ? torrentID : torrent.id)
                        .then(URI => {
                            var WebTorrent = require('webtorrent')
                            var client = new WebTorrent()
                            console.log('URI: ',URI)
                            client.add(URI, function (torrent) {
                                let torrentFiles = torrent.files.filter((f, i) => {
                                    if (/.mp3|\.aac|\.wav/.test(f.name)) return f
                                }
                                )
                                var customSort = function (a, b) {
                                    return (Number(a.name.match(/(\d+)/g)[0]) - Number((b.name.match(/(\d+)/g)[0])));
                                }
                                torrentFiles = torrentFiles.sort(customSort);
                                console.log('TORRENT FILES: ', torrentFiles.length)

                                torrentFiles.forEach(function (file, index) {
                                    if (index === data.chapter - 1) {
                                        console.log('FILE: ', file.name)
                                        const stream = file.createReadStream();
                                        const audioPath = path.join(audiodir, file.name)
                                        const writer = fs.createWriteStream(audioPath);
                                        stream.on('data', function (data) {
                                            writer.write(data);
                                            fileExists(path.resolve(path.join(audiodir,file.name)))
                                                .then(function (stat) {
                                                    if (audio !== audioPath) {
                                                        chapters = torrent.files.filter(f => /.mp3|\.aac|\.wav/.test(f.name)).length
                                                        console.log("Sending back", {title: findTitle(torrent.title), author: findAuthor(torrent.title), chapter: data.chapter, chapters, forFuture})
                                                        socket.emit('audio-loaded', {title: findTitle(torrent.title), author: findAuthor(torrent.title), chapter: data.chapter, chapters, forFuture})
                                                        audio = audioPath
                                                        return
                                                    }
                                                })

                                        });
                                    }
                                })


                            })
                        }).catch(err => console.log("Magnet Link Error", err))
                }
            }
            )
    })
    socket.on('audio-ready', function (data) {
        console.log("Audio Ready: ", data)
        var stream = ss.createStream();
        var filename = audio;
        ss(socket).emit('audio-stream', stream, { ...data, name: filename});
        fs.createReadStream(filename).pipe(stream);
    
    });
    socket.on('cover-ready', function (data) {
        fs.readFile(cover, function (err, data) {
            socket.emit('got-cover', { image: true, buffer: data, title, author, chapters });
        });
    });
    socket.on('stream-done', function ({create, title, author, chapters, src, nextsrc}) {
        socket.emit('book-ready', { create, title, author, chapters, src, nextsrc })
        fs.readdir(audiodir, (err, files) => {
            if (err) throw err;
            for (const file of files) {
              fs.unlink(path.join(audiodir, file), err => {
                if (err) throw err;
              });
            }
          });
    })
});




