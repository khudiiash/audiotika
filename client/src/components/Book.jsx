import React, { useRef, useState, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {store, setNextSrc, setSearched, setLoading} from '../redux'
import io from "socket.io-client";
import ss from "socket.io-stream";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, ClockLoader } from '../assets/icons'

function Book({ book }) {
    const bookRef = createRef();
    const enterTL = useRef();
    const current = useSelector(state => state.current)
    
    const { _id } = book

    const dispatch = useDispatch()

    const user = useSelector(state => state.user)
    const proxy = useSelector(state => state.proxy)

    const isLoading = useSelector(state => state.player.isLoading)

   

    useEffect(() => {
        let bookHTML = bookRef.current
        dispatch(setNextSrc(""))
        
        if (book._id === user.currentBookID && !current.searched) {
            console.log('play book')
            playBook()
        } else {
            dispatch(setSearched(false))
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
        //gsap.to(bookRef.current, .5, {scale: 1.05, repeat: 1, yoyo: true})
        dispatch(setLoading(true))
        let socket = io(proxy);
        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
        console.log('Book: downloading current chapter: ', book.chapter)
        socket.emit('download-chapter', {title: book.title, chapter: book.chapter, forFuture: false})
        socket.on('audio-loaded', function (data) {
        socket.emit('audio-ready', data);
        });
        ss(socket).on('audio-stream', function(stream, {forFuture, title, author, chapter, chapters, src}) {
            let parts = [];
            stream.on('data', (chunk) => {
                parts.push(chunk);
            });
            stream.on('end', function () {
                const audio = document.getElementById('audio')
                if (forFuture) {
                    console.log('Book: Future Stream Complete')
                    let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
                    socket.emit('stream-done', {create: false, title, author, nextsrc, src: current.src})
                    axios.get(proxy + '/books/'+book._id)
                    if (current.title === title) dispatch(setNextSrc(nextsrc))
                    
                } else {
                    console.log('Book: Stream Complete')
                    audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts,  { type: 'audio/mpeg' }))
                    socket.emit('stream-done', {create: false, title, author, chapters, src})
                    console.log('Book: downloading future chapter: ', book.chapter + 1)
                    socket.emit('download-chapter', {title: book.title, chapter: book.chapter + 1, forFuture: true})
                    axios.get(proxy + '/books/'+book._id)
                        .then(res => {
                            dispatch(setLoading(false))
                            dispatch(setCurrent({...res.data, src: audio.src}))
                        })
                    
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
                        {isLoading && <div className="book-loader"><ClockLoader/></div>}
                        
                        </>
            }


        </div>
    );
}

export default Book;