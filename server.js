const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const app = express()
const server = app.listen(process.env.PORT || 5000, () => console.log('Up and Running'))
const io = require('socket.io').listen(server)
const ss = require('socket.io-stream')
const path = require('path')
const findAuthor = require('./utils/findAuthor')
const findTitle = require('./utils/findTitle')
const fileExists = require('file-exists-promise')

const mongoose = require('mongoose');

app.use(cors())
app.use(bodyParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const uri = "mongodb+srv://Dmytro:149600earthsun@cluster0-mwooj.mongodb.net/audioteka?retryWrites=true&w=majority";
mongoose.connect(process.env.MONGODB_URI || uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });


app.use('/books', require('./routes/books'));
app.use('/user', require('./routes/user'));


if (process.env.NODE_ENV === 'production') {
    app.use(express.static( 'client/dist' ))
    app.get('*', (req,res) => {
        res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
    })

}

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB connected");
})

io.on('connection', function (socket) {
    audio = "";
    title = "";
    cover = "";
    author = "";
    chapters = 0;
    chapter = 0;

    socket.on('play-book', function (data) {
        let { title, chapter } = data
        fs.exists('./files/' + title, exists => {
            if (exists) {
                fs.readdir('./files/' + title, (err, files) => {
                    let file = files[chapter - 1]
                    const stream = file.createReadStream();
                    const audioPath = process.cwd() + '/files/' + title + '/' + file.name;
                    audio = audioPath;
                    socket.emit('audio-loaded')
                })
            }
        })

    })
    socket.on('download-book', function (data) {
        title = data.title
        chapter = data.chapter
        playing = false;
        audio = ""
        author = "No Author";
        chapters = 0;
        console.log('downloading ', title)
        const RutrackerApi = require('rutracker-api');
        const rutracker = new RutrackerApi();


        rutracker.login({ username: 'Khudiiash', password: '149600earthsun' })
            .then(() => rutracker.search({ query: title, sort: 'seeds' }))
            .then(torrents => {
                torrents = torrents.filter(t => /Аудио/.test(t.category) && / -| –/.test(t.title))
                if (torrents.length) {
                    let torrent = torrents[0]
                    author = findAuthor(torrent.title);
                    title = findTitle(torrent.title);
                    fs.mkdir('./files/' + title, err => console.log('Folder Exists'))
                    rutracker.getMagnetLink(torrent.id)
                        .then(URI => {
                            var WebTorrent = require('webtorrent')
                            var client = new WebTorrent()
                            client.add(URI, function (torrent) {


                                let torrentFiles = torrent.files.filter((f, i) => {
                                    if (/.mp3|\.aac|\.wav/.test(f.name)) return f
                                }
                                )
                                var customSort = function (a, b) {
                                    return (Number(a.name.match(/(\d+)/g)[0]) - Number((b.name.match(/(\d+)/g)[0])));
                                }
                                torrentFiles = torrentFiles.sort(customSort);
                                torrentFiles.forEach(function (file, index) {
                                    console.log(file.name)
                                    if (index === chapter - 1) {
                                        console.log('Getting MP3')
                                        const stream = file.createReadStream();
                                        const audioPath = process.cwd() + '/files/' + title + '/' + file.name;
                                        const writer = fs.createWriteStream(audioPath);
                                        stream.on('data', function (data) {
                                            writer.write(data);
                                            fileExists(path.resolve(process.cwd() + '/files/' + title + '/' + file.name))
                                                .then(function (stat) {
                                                    if (audio !== audioPath) {
                                                        console.log(file.name)
                                                        chapters = torrent.files.filter(f => /.mp3|\.aac|\.wav/.test(f.name)).length
                                                        socket.emit('audio-loaded')
                                                        audio = audioPath
                                                    }

                                                })

                                        });
                                    }
                                })


                            })
                        })
                }
            }
            )
    })
    socket.on('audio-ready', function (data) {
        var stream = ss.createStream();
        var filename = audio;
        ss(socket).emit('audio-stream', stream, { name: filename });
        fs.createReadStream(filename).pipe(stream);
    });
    socket.on('cover-ready', function (data) {
        fs.readFile(cover, function (err, data) {
            socket.emit('got-cover', { image: true, buffer: data, title, author, chapters });
        });
    });
    socket.on('stream-done', function (data) {
        let create = data.create
        if (create) socket.emit('book-ready', { title, author, chapters })
        fs.rmdir('./files/' + title, { recursive: true }, (err) => console.log('Folder Does Not Exist'))
    })
});




