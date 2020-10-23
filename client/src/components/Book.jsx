import React, { useRef, useState, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {store, setNextSrc, setSearched, setLoading, setPercent, isStreamingFuture} from '../redux'
import io from "socket.io-client";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, PlayerLoading } from '../assets/icons'

function Book({ book }) {
    const bookRef = createRef();
    const enterTL = useRef();
    const store = useStore();
    let chunkSize = 0;
    const { _id } = book

    const dispatch = useDispatch()

    const user = useSelector(state => state.user)
    const proxy = useSelector(state => state.proxy)
    const isLoading = useSelector(state => state.player.isLoading)
    let isCurrent = book._id === user.currentBookID;

    useEffect(() => {
        let bookHTML = bookRef.current
        if (book._id === user.currentBookID) {
            playBook()
        }
        enterTL.current = gsap.timeline({delay: .5})
            .from(bookHTML, .5, {scale: .8, autoAlpha: 0, y: -25})
            .staggerFrom(bookHTML.children, .5, {y: 10, opacity: 0}, .15)
            
        store.subscribe(() => {
                if (store.getState().current?._id === book._id) gsap.timeline().to(bookHTML, 1, {color: '#EB768E'}) 
                else gsap.to(bookHTML, .5, {color: "#e8e8e8"})
        })
        dispatch(setNextSrc(""))

    }, []);

    function onDelete (e) {
        const audio = document.getElementById('audio')

        e.stopPropagation()
        axios.delete(proxy + '/books/'+_id)
        dispatch(deleteBook(book))
        if (audio && !audio.paused && book._id === user.currentBookID) {
            audio.pause()
            dispatch(setCurrent({}))
        }

        gsap.to(bookRef.current, .5, {color: '#ff0000', opacity: 0})
    }
    function playBook() {
        console.log('Play book')
        dispatch(setLoading(true))
        let socket = io(proxy);
        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})

        socket.emit('download-chapter', {title: book.title, chapter: book.chapter, author: book.author, torrentID: book.torrentID, forFuture: false})

        socket.on('audio-loaded', function ({fileName, torrentID, chapters, forFuture}) {
            console.log('Audio Loaded')
            if (!forFuture) {
                let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
                audio.src = src
                audio.load()
                axios.get(proxy + '/books/'+book._id)
                .then(res => {
                    dispatch(setCurrent({...res.data, fileName, chapters, src}))
                    dispatch(setLoading(false))
                    if (!res.data.chapters) axios.post(proxy + '/books/update-chapters/'+res.data._id, {chapters})
                })
                if (book.chapter < book.chapters) {
                    console.log('Book: Downloading Future ', book.chapter + 1)
                    socket.emit('download-chapter', {title: book.title, chapter: book.chapter + 1, author: book.author, torrentID: book.torrentID, forFuture: true})
                }
            }
            else {
                let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
                dispatch(setNextSrc(src))
            }
        })
    }
    return (
        <div className="book" ref={bookRef} onClick={playBook}>
            <div className="book-delete" onClick={onDelete}><CloseIcon/></div>
            {
                book.cover
                    ? <img className="book-cover" src={book.cover}></img>

                    : <><div className="book-title">{book.title}</div>
                        <div className="book-author">{book.author}</div>
                        {isLoading && isCurrent && <div className="book-loader"><PlayerLoading/></div>}
                        </>
            }
        </div>
    );
}

export default Book;