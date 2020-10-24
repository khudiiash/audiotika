import React, { useState, useEffect, useRef, createRef, memo } from 'react';
import { useDispatch, useSelector, useStore } from "react-redux";
import "./style/Player.css"
import { nextChapter, setCurrent, setNextSrc, setCurrentSrc, setLoading, setPlaying, unload, setPercent, setSpeed, isStreamingFuture} from '../redux';
import io from "socket.io-client";
import ss from "socket.io-stream";
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


const Speed = (props) => {
  let playSpeed = useSelector(state => state.player.speed)
  const dispatch = useDispatch()
  const switchSpeed = () => {
    if (playSpeed < 2) playSpeed += .25
    else playSpeed = .75
    dispatch(setSpeed(playSpeed))
    let audio = document.getElementById('audio')
    audio.playbackRate = playSpeed
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


const Play = (props) => {
  const isLoading = useSelector(store => store.player.isLoading)
  const isPlaying = useSelector(store => store.player.isPlaying)
  const percent = useSelector(store => store.player.percent)
  const dispatch = useDispatch()

  useEffect(()=> {
    if (percent) dispatch(setPercent(0))
  }, []) 

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

  const onNext = () => {
    dispatch(setPlaying(false))
    const currAudio =  document.getElementById('audio').paused ? document.getElementById('audio') : document.getElementById('audio-2')
    const nextAudio = document.getElementById('audio').paused ? document.getElementById('audio-2') : document.getElementById('audio')
    const socket = io(proxy);
    currAudio.pause()
    if (current.chapter < current.chapters) {
      currAudio.currentTime = 0;
      current.prevsrc = currAudio.src
      let prevFileName = current.fileName
      current.fileName = current.nextFileName
      current.nextFileName = undefined
      socket.emit('delete-file', {torrentID: current.torrentID, fileName: prevFileName})
      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc}
      dispatch(setCurrent(current))
      console.log(nextAudio.id)
      nextAudio.play()
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
  let chunkSize = 0;

  const onPrev = () => {
    const audio = document.getElementById('audio');

    if (current && current.chapter > 1) {
      if (current.prevsrc) {
        current.nextsrc = current.src
        current.src = current.prevsrc
        current.prevsrc = undefined
        current.time = 0
        current.chapter -= 1,

        audio.currentTime = 0;

        audio.src = current.src
        audio.play()
        axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
        axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
        dispatch(setCurrent(current))

      } else if (current) {
        dispatch(setLoading(true))
        current.time = 0
        audio.pause()
        current.chapter -= 1,

        dispatch(nextChapter(current))
        axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
        axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })

        audio.currentTime = 0;

        const socket = io(proxy);

        socket.emit('download-chapter', { title: current.title, author: current.author, torrentID: current.torrentID,chapter: current.chapter, forFuture: false })

        socket.on('audio-loaded', function (data) {
          socket.emit('audio-ready', data);
        });
        ss(socket).on('audio-stream', function (stream, {forFuture, title, author, chapter, chapters, src, fileSize}) {
          let parts = [];
          if (forFuture) dispatch(isStreamingFuture(true))
          stream.on('data', (chunk) => {
            parts.push(chunk);
            chunkSize += chunk.byteLength
            if (!forFuture)
                dispatch(setPercent(Math.floor((chunkSize / fileSize) * 100)))
          });
          stream.on('end', function (data) {
            chunkSize = 0;
            dispatch(setPercent(0))
            if (forFuture) {
              dispatch(isStreamingFuture(false))
              const audio = document.getElementById('audio')
              let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
              socket.emit('stream-done', {create: false, title, author, nextsrc, src: current.src})
              dispatch(setNextSrc(nextsrc))
            } else {
              const audio = document.getElementById('audio')
              let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
              socket.emit('stream-done', {create: false, title, author, chapters, src})
              socket.emit('download-chapter', { title: current.title, author: current.author, torrentID: current.torrentID, chapter: current.chapter + 1, forFuture: true })
              audio.src = src
              audio.play()
              dispatch(setCurrentSrc(src))
              dispatch(setLoading(false))

            }

          })

        });
      }
    } else {
      audio.currentTime = 0;
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

  const proxy = useSelector(state => state.proxy)

  useEffect(() => {
    let cleanupFunction = false;
    setCurrentTime(currentTime = props.currentTime)

    if (props.currentTime >= 0 && audio) {
      setCurrentTime(currentTime = props.currentTime)
      if (audio.duration >= 0 && isFinite(audio.duration)) {setDuration(audio.duration)}
      audio.currentTime = currentTime
    }
    audio.addEventListener('timeupdate', () => {
      if (!cleanupFunction && currentTime !== parseInt(audio.currentTime, 10) && audio.currentTime > 0) {
        if (audio.duration !== duration) setDuration(audio.duration)
        setCurrentTime(currentTime = parseInt(audio.currentTime, 10))
        axios.post(proxy + '/books/update-time/' + props.currentID, { time: currentTime })
      }
    })
    audio.addEventListener('durationchange', () => {
      if (isFinite(audio.duration)) setDuration(audio.duration)
      if (props.currentTime) setCurrentTime(props.currentTime)
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
  const newBookTL = useRef();
  const dispatch = useDispatch()

  let [current, setCurrent] = useState("")
  let [mounted, setMounted] = useState(false)

  let [isFullView, setFullView] = useState(true)
  let isMobile = window.innerWidth < window.innerHeight

  store.subscribe(() => {
    setCurrent(store.getState().current)
    if (store.getState().current.title && store.getState().current.title !== document.title) {
      document.title = store.getState().current.title
    }
  })

  useEffect(() => {
    gsap.config({ force3D: false })
    setTimeout(() => setFullView(!isFullView), 1500)


    mountedTL.current = gsap.timeline()
      .from(playerBoxRef.current, 1, { y: 25, opacity: 0 }, '-=.5')
      .staggerFrom(playerBoxRef.current.children, 1, { y: 25, opacity: 0 }, .5)

    window.addEventListener('unload', function (event) {
      // dispatch(unload())
      // dispatch(setCurrent({}))
    });

  }, []);

  const onPause = () => {
    dispatch(setPlaying(false))
  }
  const onPlay = (e) => {
    const socket = io(proxy);
    const nextAudio = e.target.id === 'audio' ? document.getElementById('audio-2') : document.getElementById('audio')
    if (current.torrentID && current.chapter < current.chapters) socket.emit('download-chapter', { title: current.title, author: current.author, chapter: current.chapter + 1, torrentID: current.torrentID, forFuture: true })
    socket.on('audio-loaded', ({fileName, torrentID}) => {
      let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
      dispatch(setNextSrc({src, nextFileName: fileName}))
      nextAudio.src = src
      nextAudio.load()
      console.log('Future Loaded')
    })
    dispatch(setPlaying(true))
  }
  const onLoad = () => {
    let audio =  document.getElementById('audio')
    let current = store.getState().current
    if (current.time >= 0) audio.currentTime = current.time
  }
  const onEnded = () => {
    dispatch(setPlaying(false))
    const audio = document.getElementById('audio');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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
      dispatch(setCurrent(current))
      

    }
    // if (current.chapter < current.chapters) {
    //   audio.currentTime = 0;
    //   if (audio.src === current.nextsrc || !current.nextsrc) isFutureLoaded = false
    //   current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc, prevsrc: current.src }
    //   const socket = io(proxy);
    //   if (isFutureLoaded) {
    //     audio.src = current.src
    //     audio.load()
    //     console.log('Future Loaded')
    //     socket.emit('download-chapter', { title: current.title, author: current.author, torrentID: current.torrentID, chapter: current.chapter + 1, forFuture: true })
    //     socket.emit('delete-file', {torrentID: current.torrentID, fileName: current.fileName})
    //   } else {
    //     console.log('Future Not Loaded')
    //     audio.src = "";
    //     audio.pause();
    //     socket.emit('download-chapter', { title: current.title, author: current.author, chapter: current.chapter, torrentID: current.torrentID, forFuture: false })
    //     socket.emit('delete-file', {torrentID: current.torrentID, fileName: current.fileName})
    //   }
    //   dispatch(nextChapter(current))

    //   axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
    //   axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
  

    //   // Get next chapter src
    //   socket.on('audio-loaded', function ({fileName, torrentID, chapter, chapters, forFuture}) {
    //   if (!forFuture) {
    //       let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
    //       audio.src = src
    //       audio.load()
    //       dispatch(setCurrentSrc({src, fileName}))
    //       if (chapter < chapters) {
    //           console.log('onEnded: Downloading Future ', chapter + 1)
    //           socket.emit('download-chapter', {title: current.title, chapter: current.chapter + 1, author: current.author, torrentID: current.torrentID, forFuture: true})
    //       }
    //   }
    //   else {
    //       let src = 'https://audiotika.herokuapp.com/'+torrentID+'/'+fileName
    //       dispatch(setNextSrc({src, nextFileName: fileName}))
    //   }
    //   });
      
    // }
  }

  const toggleView = () => {
    setFullView(!isFullView)
  }
  const PlayerText = (props) => {

    let { title, author } = props

    useEffect(() => {
      audio.playbackRate = store.getState().player.speed
      
      if (!mounted)
        newBookTL.current = gsap.timeline()
          .staggerFrom(playerTextRef.current.children, 1, { y: 25, opacity: 0 }, .4)
          .call(() => setMounted(true))

    }, [])


    return <div className='player-text' ref={playerTextRef}>
      <div className='player-title'>{title}</div>
      <div className='player-author'>{author}</div>
    </div>
  }


  let playerBoxStyle = {
    top: isFullView ? (isMobile ? '10vh' : '15vh') : (isMobile ? '0vh' : '10vh'),
    height: isFullView ? (isMobile ? "70vh" : "60vh") : (isMobile ? "60vh" : "55vh")
  }

  let playerStyle = {
    top: isFullView ? (isMobile ? "-30vh" : "-22vh") : (isMobile ? "-5vh" : '-5vh')
  }

  return (
    <div id='player' className="player" style={playerStyle} ref={playerRef}>
      <div className="player-hide" style={{ transform: isFullView ? "rotate(0)" : "rotate(180deg)" }} onClick={toggleView}><HideIcon /></div>
      <div className="player-box" style={playerBoxStyle} ref={playerBoxRef}>
        {current && <PlayerText title={current.title} author={current.author} chapter={current.chapter} chapters={current.chapters} />}
        <div className="player-controls">
          <Prev current={current} />
          <Back15/>
          <Play title={current?.title} />
          <Forw15/>
          <Next current={current} />
        </div>
        {current && <Seek currentTime={current.time} chapter={current.chapter} chapters={current.chapters} src={current.src} currentID={current._id} />}
        <audio id='audio' src={current?.src} onEnded={onEnded} onPlay={onPlay} onPause={onPause} onLoadedData={onLoad}>
        </audio>
        <audio id='audio-2' src={current?.nextsrc} onEnded={onEnded} onPlay={onPlay} onPause={onPause} onLoadedData={onLoad}></audio>
      </div>
    </div>
  );
}


export default Player;