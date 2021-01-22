import React, { useRef, useState, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {setNextSrc, setLoading, setPlaying, setBookInfo } from '../redux'
import io from "socket.io-client";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, PlayerLoading } from '../assets/icons'
import {
    CircularProgressbar,
    buildStyles
  } from "react-circular-progressbar";
  import "react-circular-progressbar/dist/styles.css";

const Chapter = (props) => {
    let { chapter, chapters } = props
    if (chapter && chapters) return <div className='book-chapter-pie'>
      <CircularProgressbar
      value={chapter/chapters * 100}
      strokeWidth={10}
      styles={buildStyles({
        pathColor: "#c06174",
        trailColor: "#2d2d2d",
        strokeLinecap: "butt"

      })}
      />
    </div>
    else return <div className='book-chapter-pie'></div>
  }
function log(msg) {
    if (document.getElementById('log'))
        document.getElementById('log').text = msg
}
function Book({ book }) {
    const bookRef = createRef();
    const titleRef  = createRef();
    const enterTL = useRef();
    const store = useStore();
    const { _id } = book

    const dispatch = useDispatch()

    const user = useSelector(state => state.user)
    const proxy = useSelector(state => state.proxy)
    const [isLoading, bookLoading] = useState(false)
    let isCurrent = book._id === user.currentBookID;

    useEffect(() => {
        
        let bookHTML = bookRef.current;
        let titleHTML = titleRef.current;
        if (book._id === user.currentBookID) {
            playBook()
        }
      
        store.subscribe(() => {
                if (store.getState().current?._id === book._id) gsap.to(titleHTML, 1, {color: '#EB768E'}) 
                else gsap.to(titleHTML, .5, {color: "#555"})
        })
        dispatch(setNextSrc(""))

    }, []);

    function onDelete (e) {
        const audio = document.getElementById('audio')
        let socket = io(proxy);
        let current = store.getState().current
        e.stopPropagation()
        axios.delete(proxy + '/books/'+_id)
        if (current.fileName) socket.emit('delete-file', {torrentID: current.torrentID, fileName: current.fileName})
        if (current.nextFileName) socket.emit('delete-file', {torrentID: current.torrentID, fileName: current.nextFileName})
        dispatch(deleteBook(book))
        dispatch(setLoading(false))
        if (audio && !audio.paused && book._id === user.currentBookID) {
            audio.pause()
            audio.currentTime = 0;
            audio.src = '';
            dispatch(setCurrent(''))
        }

        gsap.to(bookRef.current, .5, {color: '#ff0000', opacity: 0})
    }
    function playBook(title) {

        if (title) {
            bookLoading(title);
        }

        dispatch(setPlaying(false))
        dispatch(setLoading(true))

        const audio = document.getElementById('audio')
        const current = store.getState().current
        let socket = io(proxy);

        audio.pause()

        let cc = current.chapter;
        let bc = book.chapter;

       // setTimeout(() => log('current: '+cc, 'book: '+bc), 2000)
        
        //if (current && current.title && current.chapter) {
        //    log('downloading', current.chapter)
        //    socket.emit('download-chapter', {title: current.title, chapter: current.chapter, author: current.author, torrentID: current.torrentID, forFuture: false})
        //} else {
            socket.emit('download-chapter', {title: book.title, chapter: book.chapter, author: book.author, torrentID: book.torrentID, forFuture: false})
        //}
        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})

        dispatch(setCurrent({...store.getState().current, time: 0, canPlay: false}))
       
        socket.on('book-info-ready', info => {
            dispatch(setBookInfo(info))
        })
        
        socket.on('audio-loaded', function ({fileName, torrentID, chapters, forFuture}) {
            if (!forFuture && audio) {
                let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
                audio.src = src
                audio.load()
                axios.get(proxy + '/books/'+book._id)
                .then(res => {
                    bookLoading(false)
                    dispatch(setCurrent({...res.data, fileName, chapters, src, canPlay: true}))
                    if (!res.data.chapters) axios.post(proxy + '/books/update-chapters/'+res.data._id, {chapters})
                })
            }
        })
    }
    return (
        <div className="book" ref={bookRef} onClick={() => playBook(book.title)}>
            <div className='book-content'>
                <div className="book-delete" onClick={onDelete}><CloseIcon/></div>
                <div className="book-title" ref={titleRef}>{book.title}</div>
                <div className="book-author">{book.author}</div>  
                <div className="book-author">{book.chapter}/{store.getState().current.chapter}</div>    
               <Chapter chapter={book.chapter} chapters={book.chapters}/>
                {isLoading === book.title && <div className="book-loader"><PlayerLoading/></div>}
            </div>
        </div>
    );
}

export default Book;