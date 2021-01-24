import React, { useState, useEffect, useRef, createRef, memo } from 'react';
import { useDispatch, useSelector, useStore } from "react-redux";
import "./style/Player.css"
import { nextChapter, setCurrent, setNextSrc, setBookInfo, setCurrentSrc, setLoading, setPlaying, setPlayerTime, unload, setPercent, setSpeed, isStreamingFuture, store, deleteBook} from '../redux';
import io from "socket.io-client";
import axios from "axios"
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, HideIcon, PlayerLoading, Back15Icon, Forw15Icon } from '../assets/icons'
import { secToTime } from './_utils'
import './style/Inputs.css'
import gsap from 'gsap'
import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function log(id, text, color) {
  let l = document.getElementById(id)
  if (l) {
      l.innerText = text
      if (color) l.style.color = color
      setTimeout(() => l.innerText = '', 10000)
  }

}
function getFutureChapter(dispatch, current, socket) {
  try {
    //log('on-play-log', `getting future chapter ${current.chapter + 1}`, 'yellowgreen')
    if (current.torrentID && current.chapter < current.chapters) socket.emit('download-chapter', { title: current.title, author: current.author, chapter: current.chapter + 1, torrentID: current.torrentID, forFuture: true })
    else log('on-play-log', `error: no current.torrentID (${current.torrentID}) or chapter (${current.chapter}) or chapters (${current.chapters})`, 'red')
    socket.on('audio-loaded', ({fileName, torrentID}) => {     
      let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
      if (fileName !== current.fileName && src !== current.src) {
        //log('on-play-log', `set future chapter ${current.chapter + 1}`, 'yellowgreen')
        dispatch(setNextSrc({src, nextFileName: fileName})) 
      }
      else if (fileName === current.fileName) {
        log('on-play-log', `fileName ${fileName} == current.fileName ${current.fileName}`, 'red')
      }
      else if (src === current.src) {
        log('on-play-log', `future src ${src} == current src ${current.src}`, 'red')
      } else {
        log('on-play-log', `unknown issue`, 'red')
      }
    })
  } catch (err) {
    log('on-play-log', 'getFutureChapter Error\n'+err, 'red')
  }
}

function checkImage(image_url){
    var img = new Image();
    img.src = image_url;
    img.onload = () => {gsap.to('.player-book-info-cover', {display: 'block'})}; 
    img.onerror = () => {gsap.to('.player-book-info-cover', {display: 'none'})}; 
}
const ChapterSelector = ({chapters, selected, socket}) => {
  const dispatch = useDispatch();
  const proxy = useSelector(state => state.proxy)

  let c = []
  for (let i = 1; i <= chapters; i++) {
    c.push(i)
  }
  const selectChapter = ({target:{value}}) => {
    let nextChapter = parseInt(value)
    let current = store.getState().current
    let audio = document.getElementById('audio')
    window.scrollTo({top: 0, left: 0, behavior: 'smooth'})
    dispatch(setLoading(true))
    audio.currentTime = 0;
    audio.src = ''
    current = {...current,  src: '', fileName: '', chapter: nextChapter, time: 0}
    socket.emit('download-chapter', { title: current.title, author: current.author, torrentID: current.torrentID,chapter: current.chapter, forFuture: false })
    socket.on('audio-loaded', function ({fileName, torrentID}) {
      let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
      current.src = src
      current.fileName = fileName
      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
      dispatch(setCurrent({...current, canPlay: true}))   
    });
  }

  return (
    <div className='player-controls-chapter'>
        <select className='player-controls-chapter-select' onChange={selectChapter} value={selected}>
        {
          c.map(ch => <option key={ch} value={ch} className='player-controls-option'>Глава {ch}</option>)
        }
      </select>
    </div>
  )
}
const BookInfo = ({info, onClick}) => {
  let {cover} = info
  checkImage(cover)
  let isP = window.innerWidth < window.innerHeight
  let isFull = isP ? /80/.test(document.querySelector('.player-box').style.height) : 
                     /60/.test(document.querySelector('.player-box').style.height)

  setTimeout(() => gsap.set('.player-book-info-cover', {width: isFull ? (isP ? '90%' : '82%') : (isP ? '70%':'75%')}), 200)

  let keys = Object.keys(info)
  let coverClass = `player-book-info-cover player-book-info-raw`
  if (keys.includes('Описание')) {
    keys.splice(keys.indexOf('Описание'),1)
    if (info['Описание'].includes('.')) keys.push('Описание')
  }
  delete keys[0]
  return (
    <div className="player-book-info" onClick={onClick}>
      <div className="player-book-info-content">
      <img src={cover} className={coverClass}></img>
      {keys.map((k, i) => {
        return <div key={i} style={{height: i === keys.length-1 && k !== 'Описание' ? '50px' : 'auto'}} className="player-book-info-raw">
          {k === 'Описание'
          ? <div className="player-book-info-description">{info['Описание']}</div>
          : <><div className="player-book-info-keys">{k}</div><div className="player-book-info-values">{info[`${k}`]}</div></>
          }
          </div>
      })}
      </div>
    </div>
    )
}
const Speed = () => {
  let playSpeed = useSelector(state => state.player.speed) || 1
  const dispatch = useDispatch()
  const switchSpeed = ({target: {value}}) => {
    dispatch(setSpeed(value))
    window.scrollTo({top: 0, left: 0, behavior: 'smooth'})
    let audio = document.getElementById('audio')
    if (audio) audio.playbackRate = value
  }
  return (
  <div className='player-controls-speed'>
  <select className="player-controls-speed-select" onChange={switchSpeed} value={playSpeed}>
    <option value={.5}>50%</option>
    <option value={.75}>75%</option>
    <option value={1}>100%</option>
    <option value={1.25}>125%</option>
    <option value={1.5}>150%</option>
    <option value={1.75}>175%</option>
    <option value={2}>200%</option>
  </select>
  </div>
  
  )
}
const Back15 = () => {
  const backward15 = () => {
    let audio = document.getElementById('audio')
    if (audio) audio.currentTime = audio.currentTime >= 15 ? audio.currentTime - 15 : 0
  }
  return (
    <div onClick={backward15}>
      <Back15Icon/>
    </div>
  
  )
}
const Forw15 = () => {

  const forward15 = () => {
        let audio = document.getElementById('audio')
       if (audio) audio.currentTime += 15
  }
  return (
    <div onClick={forward15}>
      <Forw15Icon/>
    </div>
   
  )
}

const PlayerText = (props) => {

  let { title, author } = props
  useEffect(() => {
    if (store.getState()?.player?.speed) audio.playbackRate = store.getState().player.speed
    gsap.timeline()
      .staggerFromTo('.player-text div', .7, {y: 25, opacity: 0},{y: 0, opacity: 1}, .2)
  }, [props.title])

  return <div className='player-text'>
    <div className='player-title' onClick={props.onClick}>{title}</div>
    <div className='player-author' onClick={props.onClick}>{author}</div>
    <div className='player-author' style={{color: 'yellowgreen'}} id='on-play-log'></div>
    <div className='player-author' style={{color: 'orange'}} id='on-ended-log'></div>
  </div>
}


const Play = () => {
  const isLoading = useSelector(store => store.player.isLoading)
  const isPlaying = useSelector(store => store.player.isPlaying)
  const percent = useSelector(store => store.player.percent)
  const dispatch = useDispatch()


  const onPlay = () => {
    const audio = document.getElementById('audio')
    if (audio.src && !isPlaying) {
      audio.play()
      dispatch(setPlaying(true))
    } else if (audio.src && isPlaying) {
      audio.pause()
      dispatch(setPlaying(false))
    }
  }
  return (
    <div className='player-controls-play' id="play-button" onClick={onPlay}>
      {isLoading && store.getState().current.title ? <PlayerLoading percent={percent}/> : isPlaying ? <PauseIcon /> : <PlayIcon />}
    </div>
  )
}

const Next = ({ current, socket }) => {
  const proxy = useSelector(state => state.proxy)
  const dispatch = useDispatch()
  const store = useStore()

  const onNext = () => {
    dispatch(setPlaying(false))
    const audio = document.getElementById('audio')
    audio.pause()
    if (current.chapter < current.chapters && !store.getState().player.isLoading) {
      audio.currentTime = 0;
      current.prevsrc = audio.src
      let prevFileName = current.fileName
      current.fileName = current.nextFileName
      current.nextFileName = undefined
      socket.emit('delete-file', {torrentID: current.torrentID, fileName: prevFileName})
      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc}
      audio.load()

      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
      dispatch(setCurrent(current))   
      dispatch(setLoading(true))
    }
  }

return (
  <div className='player-controls-next' onClick={onNext}>
    <NextIcon />
  </div>
)
}
const Prev = ({ current, socket }) => {
  const dispatch = useDispatch()
  const proxy = useSelector(state => state.proxy)
  const store = useStore()
  const onPrev = () => {
    const audio = document.getElementById('audio');
    audio.currentTime = 0;
    if (current && current.chapter > 1 && !store.getState().player.isLoading) {
        dispatch(setLoading(true))
        if (audio.src) {
          current.nextsrc = audio.src
          current.nextFileName = current.fileName
        }
        audio.src = ''
        current = {...current,  src: '', fileName: '', chapter: current.chapter-1, time: 0}
        socket.emit('download-chapter', { title: current.title, author: current.author, torrentID: current.torrentID,chapter: current.chapter, forFuture: false })
        socket.on('audio-loaded', function ({fileName, torrentID}) {
          let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
          current.src = src
          current.fileName = fileName
          axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
          axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
          dispatch(setCurrent(current))   
          dispatch(setLoading(false))
        });
    }

  }
  return (
    <div className='player-controls-prev' onClick={onPrev}>
      <PrevIcon />
    </div>
  )
}
const Seek = (props) => {
  const audio = document.getElementById('audio')
  let [currentTime, setCurrentTime] = useState(0)
  let [duration, setDuration] = useState(0)  
  let dispatch = useDispatch()
  const {socket} = props
  const proxy = useSelector(state => state.proxy)

  useEffect(() => {
    let cleanupFunction = false;
    if (props.currentTime >= 0 && audio) {
      if (props.canPlay) dispatch(setLoading(false))
      setCurrentTime(currentTime = props.currentTime)
    }
    audio.addEventListener('timeupdate', () => {
      if (!cleanupFunction && currentTime !== parseInt(audio.currentTime, 10) && !audio.paused) {
          let seconds = parseInt(audio.currentTime, 10)
          axios.post(proxy + '/books/update-time/' + props.currentID, { time: currentTime });
          if (seconds === 10 && !store.getState().current.nextFileName) {
              getFutureChapter(dispatch, store.getState().current, socket)
          }
          if (seconds === 100 && !store.getState().current.nextFileName) {
            getFutureChapter(dispatch, store.getState().current, socket)
          }
          setCurrentTime(currentTime = parseInt(audio.currentTime, 10))
      }
    })
    audio.addEventListener('durationchange', () => {
      if (isFinite(audio.duration)) {setDuration(audio.duration)}
    })
    return () => {cleanupFunction = true};
  }, [props.src, props.currentTime, props.canPlay])

  const onChange = ({ target: { value } }) => {
    setCurrentTime(currentTime = parseInt(value));
    if (audio) audio.currentTime = value;
    
  }
  const Chapter = (props) => {
    let { chapter, chapters } = props
    if (chapter && chapters) return <div className='player-chapter-pie'>
      <CircularProgressbar
      value={chapter/chapters * 100}
      strokeWidth={50}
      styles={buildStyles({
        pathColor: "#c06174",
        trailColor: "#2d2d2d",
        strokeLinecap: "butt"

      })}
      />
    </div>
    else return <div className='player-chapter-pie'></div>
  }
  return (
    <div className='player-controls-seek'>
      <input type="range" value={currentTime} min={0} max={duration >= 0 ? duration : 0} onChange={onChange} />
      <div className='player-controls-text'>
        <div className="player-controls-cts">{secToTime(currentTime)}</div>
        <ChapterSelector chapters={props.chapters} selected={props.chapter} socket={socket}/>
        <Chapter chapter={props.chapter} chapters={props.chapters} />
        <Speed/>
        <div className="player-controls-ds">{duration >= 0 ? secToTime(duration) : "00:00"}</div>
      </div>
    </div>
  )
}


function Player() {
  const store = useStore();
  const playerRef = createRef();
  const playerTextRef = createRef();
  const playerBoxRef = createRef();
  const proxy = useSelector(state => state.proxy)

  const mountedTL = useRef();
  const dispatch = useDispatch()

  let [current, setCurrent] = useState("")
  let [isFullView, setFullView] = useState(true)
  let isMobile = window.innerWidth < window.innerHeight
  const socket = io(proxy, {forceNew: true});


  store.subscribe(() => {
    setCurrent(store.getState().current)
    if (store.getState().current.title && store.getState().current.title !== document.title) {
      document.title = store.getState().current.title
    }
  })

  socket.on('error', () => {
    //log('on-play-log', 'socket error', 'aquamarine')
    socket.connect()
  })


  useEffect(() => {
    gsap.config({ force3D: false })
    setTimeout(() => setFullView(!isFullView), 1500)
    if (current && current._id) {
      axios.get(proxy + '/books/'+current._id)
        .then(res => {
          if (current.chapter < res.data.chapter) {
            document.location.reload()
            return
          }
        })
    }
  }, []);

  

  const onPause = () => {
    dispatch(setPlaying(false))
  }
  const onPlay = () => {
    const audio = document.getElementById('audio');
    current = store.getState().current
    if (audio && audio.currentTime === 0) {
      audio.currentTime = current.time
    }
    if (!current.nextFileName) getFutureChapter(dispatch, current, socket)
    dispatch(setLoading(false))
    dispatch(setPlaying(true))
  }

  function onEnded() {
    dispatch(setPlaying(false))
    const audio = document.getElementById('audio');
    if (current.chapter < current.chapters) {
      try {
        if (current.nextFileName === current.fileName) log('on-ended-log', `equal files`, 'red')
        audio.pause()
        audio.currentTime = 0;
        if (!current.nextFileName) {
          log('on-ended-log', 'no next file', 'red')
          setTimeout(() => document.location.reload(), 1000)
        }
        current.prevsrc = audio.src
        audio.src = current.nextsrc
        let prevFileName = current.fileName
        current.fileName = current.nextFileName
        current.nextFileName = undefined
        audio.load()
        socket.emit('delete-file', {torrentID: current.torrentID, fileName: prevFileName})
        current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc}
        axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
        axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
        dispatch(nextChapter(current)) 
      }
      catch (err) {
        log('error in onEnded code\n'+err.message)
      }
    } else if (current.chapter === current.chapters) {
      if (current.fileName) socket.emit('delete-file', {torrentID: current.torrentID, fileName: current.fileName})
    } else {
      log(`else: it says that ${current.chapter} >= ${current.chapters}`)
    }
  }
  const onCanPlay = () => {
    //if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) dispatch(setLoading(false))
  }

  const onCanPlayThrough = () => {
    //dispatch(setLoading(false))
  }
  const toggleView = () => {
    let isM = window.innerWidth < window.innerHeight;
    let isFull = !isFullView;
    gsap.to('.player-book-info-cover', .5, {width: isFull ? (isM ? '90%' : '82%') : (isM ? '70%':'75%')})
    setFullView(!isFullView)

  }
  const getInfo = () => {
    if (gsap.getProperty('.player-text div', 'opacity')) {
      gsap.timeline()
      .staggerFromTo('.player-text div', .6, {y: 0, opacity: 1}, {y: -25, opacity: 0}, .2)
      .staggerFromTo('.player-book-info-raw', .5, {y: 25, opacity: 0},{y: 0, opacity: 1}, .05)
    }
    else {
      gsap.timeline()
      .staggerTo('.player-book-info-raw', .5, {y: -25, opacity: 0}, .05)
      .staggerFromTo('.player-text div', .6, {y: 25, opacity: 0},{y: 0, opacity: 1}, .2)
    }
  }
  let playerBoxStyle = {
    top: isFullView ? (isMobile ? '5vh' : '15vh') : (isMobile ? '0vh' : '10vh'),
    height: isFullView ? (isMobile ? "80vh" : "60vh") : (isMobile ? "60vh" : "55vh")
  }

  let playerStyle = {
    top: isFullView ? (isMobile ? "-30vh" : "-22vh") : (isMobile ? "-5vh" : '-5vh')
  }
  return (
    <div id='player' className="player" style={playerStyle} ref={playerRef}>
      <div className="player-hide" style={{ transform: isFullView ? "rotate(0)" : "rotate(180deg)" }} onClick={toggleView}><HideIcon /></div>
      <div className="player-box" style={playerBoxStyle} ref={playerBoxRef}>
        {current && <PlayerText onClick={getInfo} title={current.title} author={current.author} chapter={current.chapter} chapters={current.chapters} />}
        {current.info && <BookInfo info={current.info} onClick={getInfo}/>}
        <div className="player-controls">
          <Prev current={current} socket={socket}/>
          <Back15/>
          <Play title={current?.title} socket={socket}/>
          <Forw15/>
          <Next current={current} socket={socket}/>
        </div>
        {current && <Seek currentTime={current.time} chapter={current.chapter} chapters={current.chapters} src={current.src} currentID={current._id} canPlay={current.canPlay} socket={socket}/>}
        <audio id='audio' src={current?.src} onEnded={onEnded} onPlay={onPlay} onPause={onPause} onCanPlay={onCanPlay} onCanPlayThrough={onCanPlayThrough}>
        </audio>
      </div>
    </div>
  );
}


export default Player;