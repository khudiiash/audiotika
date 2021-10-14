import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux'
import {SearchIcon} from "../assets/icons.js";
import io from "socket.io-client";
import axios from 'axios'

import "./style/Search.css";
import { addBook } from '../redux/index.js';

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
            let {id, title, author} = result[i]

            if (Array.isArray(books) && !books.filter(b => b.title === title).length) {
                const book = {userID: user._id, torrentID: id, title, author, chapter: 1, chapters: 0, cover: "", time: 0}
                axios.post(proxy + '/books/add', {...book})
                    .then(res => {
                        let {book} = res.data 
                        axios.post(proxy + '/user/update-current', {userID: user._id, currentBookID: book._id})
                            .then(() => dispatch(addBook(book)))
                })
                    .catch(err => {console.log('%cERROR','color:red');console.log(err)})
                books.push(book)
             }
            setSearchResult([])
            
        }

        return (
            <div className='search-result' style={{height: result.length > 0 ? '80vh' : 0}}>
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