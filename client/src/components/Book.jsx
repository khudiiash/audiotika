import React, { useRef, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {setNextSrc, setLoading} from '../redux'
import io from "socket.io-client";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, PlayerLoading } from '../assets/icons'

function Book({ book }) {
    const bookRef = createRef();
    const titleRef  = createRef();
    const enterTL = useRef();
    const store = useStore();
    const { _id } = book

    const dispatch = useDispatch()

    const user = useSelector(state => state.user)
    const proxy = useSelector(state => state.proxy)
    const isLoading = useSelector(state => state.player.isLoading)
    let isCurrent = book._id === user.currentBookID;

    useEffect(() => {
        let bookHTML = bookRef.current;
        let titleHTML = titleRef.current;
        if (book._id === user.currentBookID) {
            playBook()
        }
        //enterTL.current = gsap.timeline({delay: .5})
            //.from(bookHTML, .5, {scale: .8, autoAlpha: 0, y: -25})
            //.staggerFrom(bookHTML.children, .5, {y: 10, opacity: 0}, .15)
            
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
        if (audio && !audio.paused && book._id === user.currentBookID) {
            audio.pause()
            audio.currentTime = 0;
            audio.src = '';
            dispatch(setCurrent(''))
        }

        gsap.to(bookRef.current, .5, {color: '#ff0000', opacity: 0})
    }
    function playBook() {
        dispatch(setLoading(true))
        dispatch(setCurrent({...store.getState().current, time: 0}))
        const audio = document.getElementById('audio')
        let socket = io(proxy);
        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
        axios.get(proxy + '/books/'+book._id)
                .then(res => {
                    socket.emit('download-chapter', {title: res.data.title, chapter: res.data.chapter, author: res.data.author, torrentID: res.data.torrentID, forFuture: false})
                })
        socket.on('audio-loaded', function ({fileName, torrentID, chapters, forFuture, info}) {
            if (!forFuture && audio) {
                let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
                audio.src = src
                audio.load()
                axios.get(proxy + '/books/'+book._id)
                .then(res => {
                    dispatch(setCurrent({...res.data, fileName, chapters, src}))
                    if (!res.data.chapters) axios.post(proxy + '/books/update-chapters/'+res.data._id, {chapters})
                })
            }
        })
    }
    return (
        <div className="book" ref={bookRef} onClick={playBook}>
            <div className='book-content'>
                <div className="book-delete" onClick={onDelete}><CloseIcon/></div>
                <div className="book-title" ref={titleRef}>{book.title}</div>
                <div className="book-author">{book.author}</div>
                {isLoading && isCurrent && <div className="book-loader"><PlayerLoading/></div>}
            </div>
        </div>
    );
}

export default Book;