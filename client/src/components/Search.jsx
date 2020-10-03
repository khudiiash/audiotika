import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux'
import {SearchIcon} from "../assets/icons.js";
import io from "socket.io-client";
import ss from "socket.io-stream";
import axios from 'axios'

import "./style/Search.css";
import { addBook, setCurrent, setLoading } from '../redux/index.js';

const sizeToString = (bytes) => {
    let size =  Math.floor(bytes / 1000000)
    if (size < 1000) return size+" Mb"
    else {
        size = String(size);
        return `${size[0]},${size[1]} Gb`
    }
}


 function Search() {
    let [title, setTitle] = useState("")
    let [isVisible, setVisible] = useState(false)
    let [isSearching, setSearching] = useState(false)
    let [searchResult, setSearchResult] = useState([])
    let isMobile = window.innerWidth < window.innerHeight
    const proxy = useSelector(state => state.proxy)
    const current = useSelector(state => state.current)


    const user = useSelector(state => state.user)

    let lastTitle = "";
    let books = useSelector(state => state.books)

    let dispatch = useDispatch()
    let socket = io(proxy);
    
    const onChange = (e) => {
        setTitle(title = e.target.value)
    }
    const toggleSearch = () => {
        setVisible(!isVisible)
        setSearchResult([])
        if (!isVisible) document.getElementById('search-input').focus()

    }
    const onSubmit = (e) => {
        e.preventDefault()

    
        if (title) {
            lastTitle = title;
            setSearching(true)
            socket.emit('search-book', {title})
            socket.on('search-result', function({result}) {
                setSearchResult(result)
                setSearching(false)
            })
            setTitle(title = "")
            toggleSearch()
        } else {
            toggleSearch()
        }
    }

    

    const searchStyle = {
        width: isVisible ? (isMobile ? "75%" : "50%") : "0", 
        opacity: isVisible ? 1 : 0
    }


    const SearchResult = ({result, setSearching}) => {

        const onBookClick = (i) => {
            let {id, title} = result[i]
            socket.emit('download-chapter', {torrentID: id, title, chapter: 1, forFuture: false})
            setSearchResult([])
            setSearching(true)

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
                        console.log('Future Stream Complete')
                        let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts,  { type: 'audio/mpeg' }))
                        socket.emit('stream-done', {create: false, title, author, chapter, chapters, nextsrc, src: current.src})
                    } else {
                        console.log('Stream Complete')
                        let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts,  { type: 'audio/mpeg' }))
                        audio.src = src
                        socket.emit('stream-done', {create: true, title, author, chapter, chapters, src})
                        socket.emit('download-chapter', {title, chapter: 2, forFuture: true})
                        setSearching(false)
                        
                    }
                
                });
            });
            socket.on('book-ready', ({create, title, author, chapters, src, nextsrc}) => {
                lastTitle = title
                console.log('Book Ready', create)
                if (create) {
                    if (Array.isArray(books) && !books.filter(b => b.title === lastTitle).length) {
                        const book = {userID: user._id,title: lastTitle, author, chapter: 1, chapters, cover: "", src, time: 0}
                        axios.post(proxy + '/books/add', {...book})
                            .then(res => {
                                let {book} = res.data    
                                book.src = src
                                book.searched = true;
                                dispatch(addBook(book))
                                dispatch(setCurrent(book))
                                axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
                        })
                        books.push(book)
                     }
                } else {
                    current.nextsrc = nextsrc
                    if (current.title) dispatch(setCurrent(current))
                }
                
            })
        }

        return (
            <div className='search-result'>
                <ul className='search-result-list'>
                    {result.length > 0 && result.map((t,i) => {
                        return <li key={i} onClick={() => onBookClick(i)} className="search-result-list-item">
                                <div className='search-result-list-item-top'>{t.title}</div>
                                <div className='search-result-list-item-middle'>{t.author}</div>
                    <div className='search-result-list-item-bottom'>Size: {sizeToString(t.size)} &#183; Seeds: {t.seeds}</div>
                            </li>
                    })}
                </ul>
            </div>
        )
    }

   
    return (
        <div className="search">
            <form onSubmit={onSubmit}>
               <div className='search-animation' style={{opacity: isSearching ? 1 : 0}}></div>
               <input type="text" id="search-input" value={title} style={searchStyle} onChange={onChange}/>
                <button type="submit" id='search-button'>
                    <SearchIcon/>
                </button>
            </form>
            <SearchResult result={searchResult} setSearching={setSearching}/>
        </div>
    );
}

export default Search;