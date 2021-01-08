import { createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import throttle from 'lodash.throttle';

import { loadState, saveState } from "./localStorage"
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
const SET_LOADING = 'SET_LOADING'
const SET_PLAYING = 'SET_PLAYING'
const SET_PERCENT = 'SET_PERCENT'
const SET_PLAYER_TIME = 'SET_PLAYER_TIME'
const SET_SPEED = 'SET_SPEED'
const STREAMING_FUTURE = 'STREAMING_FUTURE'
const UNLOAD = 'UNLOAD'
const SET_BOOK_INFO = 'SET_BOOK_INFO'

//cd client && npm run build && cd .. && git add . && git commit -m "init" && git push heroku master 


// Reducers
const initialState = {
    user: {},
    books: [],
    current: "",
    player: { isLoading: false, isPlaying: false, isPaused: false, percent: 0, speed: 1 },
    proxy: "",
    proxy: "http://audiotika.herokuapp.com"
}
function rootReducer(state = initialState, action) {
    switch (action.type) {
        case SET_USER:
            return { ...state, user: Object.assign({}, action.payload) }
        case ADD_BOOK:
            return { ...state, user: { ...state.user, currentBookID: action.payload._id }, books: state.books.unshift(action.payload), current: Object.assign({}, action.payload) }
        case SET_BOOKS:
            return { ...state, books: action.payload }
        case DELETE_BOOK:
            return { ...state, books: state.books.filter(book => book._id !== action.payload._id), current: action.payload._id === state.current?._id ? "" : state.current, player: state.current._id === action.payload._id ? Object.assign({}, { isPlaying: false, isLoading: false, percent: 0 }) : state.player }
        case NEXT_CHAPTER:
            return { ...state, books: state.books.map(book => (book._id === action.payload._id) ? action.payload : book), current: action.payload }
        case SET_CURRENT:
            return { ...state, user: { ...state.user, currentBookID: action.payload._id }, current: Object.assign({}, action.payload) }
        case SET_NEXT_SRC:
            return { ...state, current: Object.assign({}, { ...state.current, nextsrc: action.payload.src, nextFileName: action.payload.nextFileName }) }
        case SET_PREV_SRC:
            return { ...state, current: Object.assign({}, { ...state.current, prevsrc: action.payload }) }
        case SET_CURRENT_SRC:
            return { ...state, current: Object.assign({}, { ...state.current, src: action.payload.src, nextFileName: action.payload.fileName }) }
        case SET_SEARCHED:
            return { ...state, current: Object.assign({}, { ...state.current, searched: action.payload }) }
        case SET_LOADING:
            return { ...state, player: Object.assign({}, { ...state.player, isPlaying: state.player.isLoading ? false : state.player.isPlaying, isLoading: action.payload}) }
        case SET_PLAYING:
            return { ...state, player: Object.assign({}, { ...state.player, isPlaying: action.payload }) }
        case SET_PERCENT:
            return { ...state, player: Object.assign({}, { ...state.player, percent: action.payload }) }
        case SET_PLAYER_TIME:
            return { ...state, player: Object.assign({}, { ...state.player, time: action.payload }) }
        case SET_SPEED:
            return { ...state, player: Object.assign({}, { ...state.player, speed: action.payload }) }
        case SET_BOOK_INFO:
            return { ...state, current: Object.assign({}, { ...state.current, info: action.payload }) }
        case STREAMING_FUTURE:
            return { ...state, current: Object.assign({}, {...state.current, isStreamingFuture: action.payload})}
        case UNLOAD:
            return Object.assign({}, initialState)

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
export function setLoading(payload) {
    return { type: SET_LOADING, payload };
}
export function setPlaying(payload) {
    return { type: SET_PLAYING, payload };
}
export function setPercent(payload) {
    return { type: SET_PERCENT, payload };
}
export function setPlayerTime(payload) {
    return { type: SET_PLAYER_TIME, payload };
}
export function setSpeed(payload) {
    return { type: SET_SPEED, payload };
}
export function isStreamingFuture(payload) {
    return { type: STREAMING_FUTURE, payload };
}
export function setBookInfo(payload) {
    return {type: SET_BOOK_INFO, payload}
}
export function unload() {
    return { type: UNLOAD };
}






// Store
const persistedState = loadState();
export const store = createStore(rootReducer, persistedState, composeWithDevTools(applyMiddleware(thunk)))

window.store = store;
store.subscribe(throttle(() => {
    saveState({
        user: store.getState().user,
        books: store.getState().books,
        current: store.getState().current,
        player: store.getState().player,
        proxy: store.getState().proxy
    });
}, 1000));




