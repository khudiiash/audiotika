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


const Speed = (props) => {
  let playSpeed = useSelector(state => state.player.speed)
  const dispatch = useDispatch()
  const switchSpeed = () => {
    if (playSpeed < 2.5) playSpeed += .25
    else playSpeed = .5
    dispatch(setSpeed(playSpeed))
    let audio = document.getElementById('audio')
    audio.playbackRate = playSpeed
  }
  return (
  <div className="player-speed" onClick={switchSpeed}>{playSpeed}x</div>
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
  const store = useStore()
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);


  const onNext = () => {
    const audio = document.getElementById('audio');
    let isFutureLoaded = true;
    let chunkSize = 0;
    if (current && current.chapter < current.chapters) {

      audio.currentTime = 0;
      if (audio.src === current.nextsrc || !current.nextsrc) isFutureLoaded = false

      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc, prevsrc: current.src }

      const socket = io(proxy);
      if (isFutureLoaded) {
        audio.src = current.src
        audio.play()
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1,torrentID: current.torrentID, forFuture: true })
      } else {
        if (!store.getState().current.isStreamingFuture) {
          audio.pause()
          socket.emit('download-chapter', { title: current.title, chapter: current.chapter,torrentID: current.torrentID, forFuture: false })
          dispatch(setLoading(true))
        } else {
          dispatch(setLoading(true))
        }
       
      }

      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })

      dispatch(nextChapter(current))
      dispatch(setCurrent(current))

      // Get next chapter src
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
        stream.on('end', function () {
          chunkSize = 0;
          dispatch(setPercent(0))
          if (forFuture) {
            dispatch(isStreamingFuture(false))
           if (store.getState().current.chapter !== chapter) {
            let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', {create: false, title, author, nextsrc, src: current.src})
            dispatch(setNextSrc(nextsrc))
            dispatch(setLoading(false))
           } else {
            socket.emit('stream-done', {create: true, title, author, chapters: chapters, src})
            socket.emit('download-chapter', { title: current.title, chapter: chapter + 1, torrentID: current.torrentID, forFuture: true })
            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            audio.src = src
            if (!isSafari) audio.play()
            dispatch(setCurrentSrc(src))
            dispatch(setLoading(false))
           }
          } else {
            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', { create: false })
            socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, torrentID: current.torrentID, forFuture: true })
            audio.src = src
            if (!isSafari) audio.play()
            dispatch(setCurrentSrc(src))
            dispatch(setLoading(false))
          }
        })
      });
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

        socket.emit('download-chapter', { title: current.title, torrentID: current.torrentID,chapter: current.chapter, forFuture: false })

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
              socket.emit('download-chapter', { title: current.title, torrentID: current.torrentID, chapter: current.chapter + 1, forFuture: true })
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
  const input = React.createRef();
  const dispatch = useDispatch()

  useEffect(() => {
    let cleanupFunction = false;
    setDuration(audio.duration)
    setCurrentTime(currentTime = props.currentTime)

    if (props.currentTime >= 0 && audio) {
      setDuration(audio.duration)
      setCurrentTime(currentTime = props.currentTime)
      audio.currentTime = currentTime
    }
    


    audio.addEventListener('timeupdate', () => {
      if (!cleanupFunction && currentTime !== parseInt(audio.currentTime, 10) && audio.currentTime > 0) {
        if (duration !== audio.duration) setDuration(duration = audio.duration)
        else setCurrentTime(currentTime = parseInt(audio.currentTime, 10))
        axios.post(proxy + '/books/update-time/' + props.currentID, { time: currentTime })

      }
    })
    return () => cleanupFunction = true;
  }, [props.src, props.currentTime])


  const onChange = ({ target: { value } }) => {
    setCurrentTime(currentTime = parseInt(value));
    if (audio) audio.currentTime = value;
    
  }
  const Chapter = (props) => {
    let { chapter, chapters } = props
    if (chapter && chapters) return <div className='player-chapter'>{chapter} / {chapters}</div>
    else return <div className='player-chapter'></div>
  }
  return (
    <div className='player-controls-seek'>
      <input type="range" value={audio.currentTime} min={0} max={isNaN(duration) ? 0 : duration} onChange={onChange} />
      <div className='player-controls-text'>
        <div className="player-controls-cts">{secToTime(audio.currentTime)}</div>
        <div></div>
        <Chapter chapter={props.chapter} chapters={props.chapters} />
        <Speed/>
        <div className="player-controls-ds">{duration ? secToTime(duration) : "00:00"}</div>
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
  const onPlay = () => {
    dispatch(setPlaying(true))

  }
  const onLoad = () => {
    if (store.getState().current.time >= 0 && store.getState().current.time !== document.getElementById('audio').currentTime) document.getElementById('audio').currentTime = store.getState().current.time 
  }
  const onEnded = () => {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let chunkSize = 0;

    dispatch(setPlaying(false))

    const audio = document.getElementById('audio');
    let isFutureLoaded = true;
    if (current.chapter < current.chapters) {
      
      audio.currentTime = 0;
      if (audio.src === current.nextsrc || !current.nextsrc) isFutureLoaded = false

      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc, prevsrc: current.src }

      const socket = io(proxy);
      if (isFutureLoaded) {
  
        audio.src = current.src
        if (!isSafari) {audio.play()}
        console.log('%cFuture Loaded, Downloading Next One: ' + (current.chapter + 1), 'color: pink')
        socket.emit('download-chapter', { title: current.title, torrentID: current.torrentID, chapter: current.chapter + 1, forFuture: true })
      } else {
        audio.src = "";
        audio.pause();
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter, torrentID: current.torrentID, forFuture: false })
        dispatch(setLoading(true))
      }
      dispatch(nextChapter(current))

      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
  

      // Get next chapter src
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
        stream.on('end', function () {
          chunkSize = 0;
          dispatch(setPercent(0))
          if (forFuture) {
          console.log(`%conEnded: Future Chatper ${chapter} Stream Ended`,'color: yellowgreen')

           dispatch(isStreamingFuture(false))
           if (store.getState().current.chapter !== chapter) {
            let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', {create: false, title, author, nextsrc, src: current.src})
            dispatch(setNextSrc(nextsrc))
            dispatch(setLoading(false))
           } else {
            socket.emit('stream-done', { create: false })
           }
          } 
          else {
            console.log(`%conEnded: Chatper ${chapter} Stream Ended`,'color: yellow')

            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', {create: false, title, author, chapters: chapters, src})
            socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, torrentID: current.torrentID, forFuture: true })
            audio.src = src
            if (!isSafari) audio.play()
            dispatch(setCurrentSrc(src))
            dispatch(setLoading(false))
          }
        })
      });
    }
  }

 
  const onCanPlayThrough = () => {}
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
        <audio id='audio' onEnded={onEnded} onPlay={onPlay} onPause={onPause} onLoadedData={onLoad} onCanPlayThrough={onCanPlayThrough}>
          {current && current.src && <source src={current.src} type="audio/mpeg"></source>}
        </audio>
      </div>
    </div>
  );
}


export default Player;