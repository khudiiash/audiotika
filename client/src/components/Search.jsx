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
    const proxy = useSelector(state => state.proxy)
    const current = useSelector(state => state.current)


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
            let socket = io(proxy);
            socket.emit('download-chapter', {title, chapter: 1, forFuture: false})

            setSearching(true)

            socket.on('audio-loaded', function (data) {
                socket.emit('audio-ready', {forFuture: data.forFuture});
                    
            });
            ss(socket).on('audio-stream', function(stream, {forFuture}) {
                let parts = [];
                stream.on('data', (chunk) => {
                    parts.push(chunk);
                });
                stream.on('end', function () {
                    const audio = document.getElementById('audio')
                    if (forFuture) {

                        console.log('Future Stream Complete')
                        let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                        socket.emit('stream-done', {create: false, src: current.src, nextsrc})
                       
                    } else {
                        console.log('Stream Complete')
                        let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                        audio.src = src
                        socket.emit('stream-done', {create: true, src})
                        socket.emit('download-chapter', {title, chapter: 2, forFuture: true})
                        setSearching(false)
                        
                    }
                
                });
            });
            socket.on('book-ready', ({create, title, author, chapters, src, nextsrc}) => {
                lastTitle = title
                if (create) {
                    if (Array.isArray(books) && !books.filter(b => b.title === lastTitle).length) {
                        const book = {userID: user._id,title: lastTitle, author, chapter: 1, chapters, cover: "", src, time: 0}
                        axios.post(proxy + '/books/add', {...book})
                            .then(res => {
                                let {book} = res.data    
                                book.src = src
                                dispatch(addBook(book))
                                dispatch(setCurrent(book))
                                axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
                        })
                        books.push(book)
                     }
                } else {
                    dispatch(setCurrent({...current, nextsrc}))
                }
                
            })
            setTitle(title = "")
            toggleSearch()
        } else {
            toggleSearch()
        }
    }

    const searchStyle = {
        width: isVisible ? (isMobile ? "100%" : "50%") : "0", 
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