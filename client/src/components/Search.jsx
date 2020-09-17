import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux'
import {SearchIcon} from "../assets/icons.js";
import io from "socket.io-client";
import ss from "socket.io-stream";
import axios from 'axios'

import "./style/Search.css";
import { addBook, setCurrent } from '../redux/index.js';


function Search() {
    let [title, setTitle] = useState("")
    let [isVisible, setVisible] = useState(false)
    let [isSearching, setSearching] = useState(false)
    let isMobile = window.innerWidth < window.innerHeight

    const user = useSelector(state => state.user)

    let lastTitle = "";
    let books = useSelector(state => state.books)

    let dispatch = useDispatch()
    const onChange = (e) => {
        setTitle(title = e.target.value)
    }
    const toggleSearch = () => {
        setVisible(!isVisible)
        if (!isVisible) document.getElementById('search-input').focus()

    }
    const onSubmit = (e) => {
        e.preventDefault()

    
        if (title) {
            lastTitle = title;
            let socket = io();
            socket.emit('download-book', {title, chapter: 1})

            setSearching(true)

            socket.on('audio-loaded', function (data) {
                console.log('Audio Loaded')
                    socket.emit('audio-ready');
                    ss(socket).on('audio-stream', function(stream, data) {
                        console.log('Stream Began')
                        let parts = [];
                        stream.on('data', (chunk) => {
                            parts.push(chunk);
                        });
                        stream.on('end', function () {
                            console.log('Stream Complete')
                            const audio = document.getElementById('audio')
                            audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                            socket.emit('stream-done', {create: true})
                            setSearching(false)
                        });
                    });
                    
                });
            socket.on('book-ready', (data) => {
                let {author, chapters} = data
                lastTitle = data.title
                if (!books.filter(b => b.title === lastTitle).length) {
                    const book = {userID: user._id,title: lastTitle, author, chapter: 1, chapters, cover: "", time: 0}
                    axios.post('/books/add', {...book})
                        .then(res => {
                            let {book} = res.data    
                            dispatch(addBook(book))
                            dispatch(setCurrent(book))
                            axios.post('/user/update-current', {userID: user._id, currentBookID: book._id})
                    })
                    books.push(book)
                 }
            })
            setTitle(title = "")
            toggleSearch()
        } else {
            toggleSearch()
        }
    }

    const searchStyle = {
        width: isVisible ? (isMobile ? "50%" : "25%") : "0", 
        opacity: isVisible ? 1 : 0
    }
    

   
    return (
        <div className="search">
            <form onSubmit={onSubmit}>
               <div className='search-animation' style={{opacity: isSearching ? 1 : 0}}></div>
               <input type="text" id="search-input" value={title} style={searchStyle} onChange={onChange}/>
                <button type="submit" id='search-button' onClick={onSubmit}>
                    <SearchIcon/>
                </button>
            </form>
        </div>
    );
}

export default Search;