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
        axios.get(proxy + '/books')
           .then(res => {
              if (res.data && res.data !== books && res.data.some(book => book.userID === user._id)) {
                  dispatch(setBooks(res.data.filter(book => book.userID === user._id)))
              }
        })
    }, [])
    useEffect(() => {
        axios.get(proxy + '/books')
           .then(res => {
              if (res.data.length !== books.length) {
                  dispatch(setBooks(res.data.filter(book => book.userID === user._id)))
              }
        })
    }, [current])

    // books = [
    //     {
    //         title: "Гарри Поттер и Философский камень",
    //         author: "Джоан Роулинг",
    //         chapter: 1,
    //         chapters: 145,
    //         time: 0,
    
    //     }
    // ]
    
    return (
        <div className="booklist">
            {books && Array.isArray(books) ? books.map(book => <Book book={book} key={book._id} isCurrent={current && current._id === book._id} />) : ""}
        </div>
    );
}

export default BookList;