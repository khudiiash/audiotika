import React, {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Book } from './_components'
import "./style/BookList.css"
import axios from 'axios'
import { setBooks } from '../redux'


function BookList() {
    let dispatch = useDispatch()
    let user = useSelector(state => state.user)
    let current = useSelector(state => state.current)
    let books = useSelector(state => state.books)
    const proxy = useSelector(state => state.proxy)


    if (!books.length || (current && !books.some(b => b.title === current.title))) {
        axios.get(proxy + '/books')
           .then(res => {
               console.log(res.data, books)
              if (res.data && res.data.some(book => book.userID === user._id)) dispatch(setBooks(books = res.data.filter(book => book.userID === user._id)))
            })
        
    }
    return (
        <div className="booklist">
            {books && Array.isArray(books) ? books.map(book => <Book book={book} key={book._id} isCurrent={current && current._id === book._id} />) : ""}
        </div>
    );
}

export default BookList;