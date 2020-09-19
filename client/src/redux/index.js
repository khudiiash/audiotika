import { createStore } from "redux"
import throttle from 'lodash.throttle';

import {loadState, saveState} from "./localStorage"
// Constants
const ADD_BOOK = 'ADD_BOOK'
const NEXT_CHAPTER = 'NEXT_CHAPTER'
const SET_CURRENT = 'SET_CURRENT'
const SET_USER = 'SET_USER'
const SET_BOOKS = 'SET_BOOKS'
const DELETE_BOOK = 'DELETE_BOOK'
const SET_PREV_SRC = 'SET_PREV_SRC'
const SET_NEXT_SRC = 'SET_NEXT_SRC'
const SET_CURRENT_SRC = 'SET_CURRENT_SRC'
const SET_SEARCHED = 'SET_SEARCHED'





// Reducers
const initialState = {
    user: {},
    books: [],
    current: {},
    //proxy: "http://localhost:5000",
    proxy: ""
}
function rootReducer(state = initialState, action) {
    switch (action.type) {
        case SET_USER:
            return {...state, user: Object.assign({}, action.payload)}
        case ADD_BOOK:
            return {...state, books: state.books.unshift(action.payload)}
        case SET_BOOKS:
            return {...state, books: action.payload}
        case DELETE_BOOK:
            return {...state, books: state.books.filter(book => book._id !== action.payload._id), current: action.payload._id === state.current?._id ? null : state.current}
        case NEXT_CHAPTER:
            return {...state, books: state.books.map(book => (book._id === action.payload._id) ? action.payload : book), current: action.payload}
        case SET_CURRENT:
            return {...state, user: {...state.user, currentBookID: action.payload._id }, current: Object.assign({}, action.payload)}
        case SET_NEXT_SRC:
            return {...state, current: Object.assign({}, {...state.current,  nextsrc: action.payload})}
        case SET_PREV_SRC:
            return {...state, current: Object.assign({}, {...state.current,  prevsrc: action.payload})}
        case SET_CURRENT_SRC:
            return {...state, current: Object.assign({}, {...state.current,  src: action.payload})}
        case SET_SEARCHED:
            return {...state, current: Object.assign({}, {...state.current,  searched: action.payload})}
            
    }
    return state;
}

// Actions
export function addBook(payload) {
    return { type: ADD_BOOK, payload };
}
export function nextChapter(payload) {
    return { type: NEXT_CHAPTER, payload };
}
export function setCurrent(payload) {
    return { type: SET_CURRENT, payload };
}
export function setUser(payload) {
    return { type: SET_USER, payload };
}
export function setBooks(payload) {
    return { type: SET_BOOKS, payload };
}
export function deleteBook(payload) {
    return { type: DELETE_BOOK, payload };
}
export function setNextSrc(payload) {
    return { type: SET_NEXT_SRC, payload };
}
export function setPrevSrc(payload) {
    return { type: SET_PREV_SRC, payload };
}
export function setCurrentSrc(payload) {
    return { type: SET_CURRENT_SRC, payload };
}
export function setSearched(payload) {
    return { type: SET_CURRENT_SRC, payload };
}



// Store
const persistedState = loadState();
export const store = createStore(rootReducer, persistedState, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

window.store = store;
store.subscribe(throttle(() => {
    saveState({
      user: store.getState().user,
      books: store.getState().books,
      current: store.getState().current,
      proxy: store.getState().proxy
    });
  }, 1000));

