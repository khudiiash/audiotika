import React, { useRef, useState, createRef, useEffect } from "react";
import { useDispatch, useSelector, useStore } from 'react-redux'
import axios from 'axios'
import {store} from '../redux'
import io from "socket.io-client";
import ss from "socket.io-stream";
import "./style/Book.css";
import gsap from "gsap";
import { setCurrent, deleteBook } from "../redux";
import { CloseIcon, ClockLoader } from '../assets/icons'

function Book({ book, isCurrent }) {
    const bookRef = createRef();
    const enterTL = useRef();
    
    const { _id } = book

    const dispatch = useDispatch()
   

    const user = useSelector(state => state.user)

    let [loading, setLoading] = useState(false)

   

    useEffect(() => {
        let bookHTML = bookRef.current

        enterTL.current = gsap.timeline({delay: .5})
            .from(bookHTML, .5, {scale: .8, autoAlpha: 0, y: -25})
            .staggerFrom(bookHTML.children, .5, {y: 10, opacity: 0}, .15)
            
        store.subscribe(() => {
                
                if (store.getState().current?._id === book._id) gsap.timeline().to(bookHTML, 1, {color: '#EB768E'}) 
                else gsap.to(bookHTML, .5, {color: "#e8e8e8"})
        })

        if (isCurrent) {
            
            playBook()

         } else {

            
         }
       

    }, []);

    function onDelete (e) {
        const audio = document.getElementById('audio')

        e.stopPropagation()
        axios.delete('/books/'+_id)
        dispatch(deleteBook(book))
        if (audio && !audio.paused && isCurrent) {
            audio.pause()
        }

        gsap.to(bookRef.current, .5, {color: '#ff0000', opacity: 0})
    }
    function playBook() {
        //gsap.to(bookRef.current, .5, {scale: 1.05, repeat: 1, yoyo: true})
        setLoading(true)
        let socket = io();
        axios.post('/user/update-current', {userID: user._id, currentBookID: book._id})
        socket.emit('download-book', {title: book.title, chapter: book.chapter})
        socket.on('audio-loaded', function (data) {
            console.log('Audio Loaded')
                socket.emit('audio-ready');
                ss(socket).on('audio-stream', function(stream, data) {
                    let parts = [];
                    stream.on('data', (chunk) => {
                        parts.push(chunk);
                    });
                    stream.on('end', function () {
                        console.log('Stream Complete')
                        const audio = document.getElementById('audio')
                        audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                        book.src = audio.src
                        socket.emit('stream-done', {create: false})
                        axios.get('/books/'+book._id)
                            .then(res => {
                                setLoading(false)
                                dispatch(setCurrent(res.data))
                            
                            })
                        
                    });
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
                        {loading && <div className="book-loader"><ClockLoader/></div>}
                        
                        </>
            }


        </div>
    );
}

export default Book;