import React, { useState, useEffect, useRef, createRef, memo } from 'react';
import { useDispatch, useSelector, useStore } from "react-redux";
import "./style/Player.css"
import { nextChapter, setCurrent, setNextSrc, setBookInfo, setCurrentSrc, setLoading, setPlaying, unload, setPercent, setSpeed, isStreamingFuture} from '../redux';
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

const BookInfo = ({info, onClick}) => {
  delete info.cover
  let keys = Object.keys(info)
  useEffect(() => {
    gsap.timeline()
      .staggerTo('.player-text div', .5, {y: -25, opacity: 0}, .2)
      .staggerTo('.player-book-info-raw', .5, {y: 0, opacity: 1}, .05)
  }, [])
  return (
    <div className="player-book-info" onClick={onClick}>
      <div className="player-book-info-content">
      {keys.map((k, i) => {
        return <div key={i} className="player-book-info-raw">
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
const Speed = (props) => {
  let playSpeed = useSelector(state => state.player.speed)
  const dispatch = useDispatch()
  const switchSpeed = () => {
    if (playSpeed < 2) playSpeed += .25
    else playSpeed = .75
    dispatch(setSpeed(playSpeed))
    let audio = document.getElementById('audio')
    if (audio && isFinite(playSpeed)) audio.playbackRate = playSpeed
  }
  return (
  <div className="player-speed" onClick={switchSpeed}>{playSpeed}X</div>
  )
}
const Back15 = (props) => {
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
const Forw15 = (props) => {

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
      {isLoading ? <PlayerLoading percent={percent}/> : isPlaying ? <PauseIcon /> : <PlayIcon />}
    </div>
  )
}

const Next = ({ current }) => {
  const proxy = useSelector(state => state.proxy)
  const dispatch = useDispatch()
  const store = useStore()

  const onNext = () => {
    dispatch(setPlaying(false))
    const audio = document.getElementById('audio')
    const socket = io(proxy);
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
const Prev = ({ current }) => {
  const dispatch = useDispatch()
  const proxy = useSelector(state => state.proxy)
  const store = useStore()
  const onPrev = () => {
    const audio = document.getElementById('audio');
    const socket = io(proxy);
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
          dispatch(setLoading(true))
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

  const proxy = useSelector(state => state.proxy)

  useEffect(() => {
    let cleanupFunction = false;
    if (props.currentTime > 0 && audio) {
      audio.currentTime = props.currentTime
      if (audio.duration >= 0 && isFinite(audio.duration)) {setDuration(audio.duration);dispatch(setLoading(false))}
      //setCurrentTime(0)
    }
    audio.addEventListener('timeupdate', () => {
      if (!cleanupFunction && currentTime !== parseInt(audio.currentTime, 10) && audio.currentTime > 0) {
        if (currentTime > 0) {
          axios.post(proxy + '/books/update-time/' + props.currentID, { time: parseInt(audio.currentTime, 10) });
        }
        if (audio.duration !== duration) {setDuration(audio.duration);dispatch(setLoading(false))}
        setCurrentTime(currentTime = parseInt(audio.currentTime, 10))
        
      }
    })
    audio.addEventListener('durationchange', () => {
      if (props.currentTime) setCurrentTime(props.currentTime)
      if (isFinite(audio.duration)) {setDuration(audio.duration);dispatch(setLoading(false))}
    })
    return () => cleanupFunction = true;
  }, [props.src, props.currentTime])

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
      <input type="range" value={audio.currentTime} min={0} max={duration >= 0 ? duration : 0} onChange={onChange} />
      <div className='player-controls-text'>
        <div className="player-controls-cts">{secToTime(audio.currentTime)}</div>
        <div className='player-chapter-text'>{props.chapter}/{props.chapters}</div>
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

  store.subscribe(() => {
    console.log(store.getState().current.time)
    setCurrent(store.getState().current)
    if (store.getState().current.title && store.getState().current.title !== document.title) {
      document.title = store.getState().current.title
    }
  })

  useEffect(() => {
    gsap.config({ force3D: false })
    setTimeout(() => setFullView(!isFullView), 1500)

    
  }, []);

  const onPause = () => {
    dispatch(setPlaying(false))
  }
  const onPlay = () => {
    const socket = io(proxy);
    if (current.torrentID && current.chapter < current.chapters) socket.emit('download-chapter', { title: current.title, author: current.author, chapter: current.chapter + 1, torrentID: current.torrentID, forFuture: true })
    socket.on('audio-loaded', ({fileName, torrentID}) => {
      let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
      dispatch(setNextSrc({src, nextFileName: fileName}))
    })
    dispatch(setLoading(false))
    dispatch(setPlaying(true))
  }
  const onLoad = () => {
     
  }

  const onEnded = () => {
    dispatch(setPlaying(false))
    const audio = document.getElementById('audio');
    const socket = io(proxy)
    if (current.chapter < current.chapters) {
      audio.pause()
      audio.currentTime = 0;
      current.prevsrc = audio.src
      audio.src = current.nextsrc
      let prevFileName = current.fileName
      current.fileName = current.nextFileName
      current.nextFileName = undefined
      audio.load()
      socket.emit('delete-file', {torrentID: current.torrentID, fileName: prevFileName})
      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc}  
      console.log('Audio 2 (onended): ',audio.currentTime)
    
      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
      dispatch(nextChapter(current))   
    }
  }
  const onCanPlay = () => {
    if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) dispatch(setLoading(false))
  }

  const onCanPlayThrough = () => {
    dispatch(setLoading(false))
  }
  const toggleView = () => {
    setFullView(!isFullView)
  }
  const getInfo = () => {
    const socket = io(proxy)
    if (document.getElementsByClassName('player-book-info').length) {
      gsap.timeline()
      .staggerTo('.player-book-info-raw', .5, {y: -25, opacity: 0}, .05)
      .staggerFromTo('.player-text div', .6, {y: 25, opacity: 0}, {y: 0, opacity: 1}, .2)
      .call(() => dispatch(setBookInfo("")))
    } else {
      socket.emit('get-book-info', {torrentID: current.torrentID})
      socket.on('book-info-ready', info => {
        dispatch(setBookInfo(info))
      })
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
          <Prev current={current} />
          <Back15/>
          <Play title={current?.title} />
          <Forw15/>
          <Next current={current} />
        </div>
        {current && <Seek currentTime={current.time} chapter={current.chapter} chapters={current.chapters} src={current.src} currentID={current._id} />}
        <audio id='audio' src={current?.src} onEnded={onEnded} onPlay={onPlay} onPause={onPause} onLoadedData={onLoad} onCanPlay={onCanPlay} onCanPlayThrough={onCanPlayThrough}>
        </audio>
      </div>
    </div>
  );
}


export default Player;