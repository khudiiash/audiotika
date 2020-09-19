import React, {useEffect, useState} from 'react';
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
    useEffect(() => {
        console.log('%c Booklist', 'color: brown')

        axios.get(proxy + '/books')
           .then(res => {
              if (res.data && res.data !== books && res.data.some(book => book.userID === user._id)) {
                  console.log("Setting Books")
                  dispatch(setBooks(res.data.filter(book => book.userID === user._id)))
              }
        })
    }, [])
    useEffect(() => {
        console.log('%c Booklist', 'color: brown')

        axios.get(proxy + '/books')
           .then(res => {
              if (res.data.length !== books.length) {
                  console.log("Setting Books")
                  dispatch(setBooks(res.data.filter(book => book.userID === user._id)))
              }
        })
    }, [current])
    console.log(books)
    
    return (
        <div className="booklist">
            {books && Array.isArray(books) ? books.map(book => <Book book={book} key={book._id} isCurrent={current && current._id === book._id} />) : ""}
        </div>
    );
}

export default BookList;