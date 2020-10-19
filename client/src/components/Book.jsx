import React, { useRef, useState, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {store, setNextSrc, setSearched, setLoading, setPercent, isStreamingFuture} from '../redux'
import {secToTime} from './_utils'
import io from "socket.io-client";
import ss from "socket.io-stream";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, PlayerLoading } from '../assets/icons'

function Book({ book }) {
    const bookRef = createRef();
    const enterTL = useRef();
    const current = useSelector(state => state.current)
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
        dispatch(setNextSrc(""))
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
        dispatch(setLoading(true))
        let socket = io(proxy);
        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
        console.log('Book: downloading current chapter: ', book.chapter, ' for '+book.title)
        socket.emit('download-chapter', {title: book.title, chapter: book.chapter, torrentID: book.torrentID, forFuture: false})
        socket.on('audio-loaded', function (data) {
            console.log('Audio Loaded')
            socket.emit('audio-ready', data);
        });
        ss(socket).on('audio-stream', function(stream, {forFuture, title, author, chapter, duration, chapters, src, fileSize, torrentID}) {
            let parts = [];
            if (forFuture) dispatch(isStreamingFuture(true))
            stream.on('data', (chunk) => {
                parts.push(chunk);
                chunkSize += chunk.byteLength
                if (!forFuture)
                    dispatch(setPercent(Math.floor((chunkSize / fileSize) * 100)))
            });
            stream.on('end', function () {
                chunkSize = 0;
                dispatch(setPercent(0))
                if (forFuture) dispatch(isStreamingFuture(false))
                const audio = document.getElementById('audio')
                if (!store.getState().current.title || store.getState().current.title === book.title) {
                    if (forFuture) {
                        console.log('Book: Future Stream Complete')
                        let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
                        socket.emit('stream-done', {create: false, title, author, nextsrc, src: current?.src})
                        axios.get(proxy + '/books/'+book._id)
                        if (store.getState().current.title === title) dispatch(setNextSrc(nextsrc))
                        
                    } else {
                        console.log('Book: Stream Complete')
                        if (audio) audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts,  { type: 'audio/mpeg' }))
                        socket.emit('stream-done', {create: false, title, author, chapters, src})
                        console.log('Book: downloading future chapter: ', book.chapter + 1)
                        socket.emit('download-chapter', {title, chapter: book.chapter + 1, torrentID: book.torrentID, forFuture: true})
                        axios.get(proxy + '/books/'+book._id)
                            .then(res => {
                                dispatch(setLoading(false))
                                dispatch(setCurrent({...res.data, chapters, src: audio?.src, duration}))
                                if (!res.data.chapters) axios.post(proxy + '/books/update-chapters/'+res.data._id, {chapters})
                            })
                        
                    }

                }
                
            });
        });
    
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