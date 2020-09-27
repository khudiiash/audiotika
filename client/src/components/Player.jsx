import React, { useState, useEffect, useRef, createRef, memo } from 'react';
import { useDispatch, useSelector, useStore } from "react-redux";
import "./style/Player.css"
import { nextChapter, setCurrent, setNextSrc, setCurrentSrc, setLoading } from '../redux';
import io from "socket.io-client";
import ss from "socket.io-stream";
import axios from "axios"
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, HideIcon, PlayerLoading } from '../assets/icons'
import { secToTime } from './_utils'
import './style/Inputs.css'
import gsap from 'gsap'



const Play = (props) => {
  let [isPlaying, setPlaying] = useState(false)
  const isLoading = useSelector(store => store.player.isLoading)

  useEffect(() => {
    setPlaying(false)
    let playinterval = setInterval(() => {
      const audio = document.getElementById('audio')
      if (audio && audio.src && !audio.paused && !isPlaying) {
        setPlaying(true);
        clearInterval(playinterval);
      }
    }, 1)

    return () => clearInterval(playinterval);

  }, [props.title])

  const onPlay = () => {
    const audio = document.getElementById('audio')
    if (audio.src && !isPlaying) {
      try { audio.play() } catch { console.log('Error in On Play') }
      setPlaying(true)
    } else if (audio.src && isPlaying) {
      try { audio.pause() } catch { console.log('Error in On Pause') }
      setPlaying(false)
    }
  }
  return (
    <div className='player-controls-play' id="play-button" onClick={onPlay}>
      {isLoading ? <PlayerLoading /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
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
    if (current && current.chapter < current.chapters) {

      audio.currentTime = 0;
      if (audio.src === current.nextsrc || !current.nextsrc) isFutureLoaded = false

      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc, prevsrc: current.src }

      const socket = io(proxy);
      if (isFutureLoaded) {
        console.log('%c Found', 'color: green')
        audio.src = current.src
        audio.play()
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, forFuture: true })
      } else {
        console.log('%c Not Found', 'color: red')
        audio.pause()
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter, forFuture: false })
        dispatch(setLoading(true))
      }

      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })

      dispatch(nextChapter(current))
      dispatch(setCurrent(current))

      // Get next chapter src
      socket.on('audio-loaded', function ({forFuture}) {
        if (forFuture) console.log('Loaded For Future') 
        else console.log('Loaded')
        socket.emit('audio-ready', { forFuture });
      });
      ss(socket).on('audio-stream', function (stream, { forFuture, chapter }) {
        if (forFuture) console.log('Stream Ready For Future') 
        else console.log('Stream Ready')
        let parts = [];
        stream.on('data', (chunk) => {
          parts.push(chunk);
        });
        stream.on('end', function () {
          console.log('%c FOR FUTURE: '+forFuture, 'color: yellow')
          if (forFuture) {
           if (store.getState().current.chapter !== chapter) {
            console.log('%c OnNext: Future', 'color: orange')
            let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', { create: false })
            dispatch(setNextSrc(nextsrc))
            dispatch(setLoading(false))
           } else {
            socket.emit('stream-done', { create: false })
            socket.emit('download-chapter', { title: current.title, chapter: chapter + 1, forFuture: true })
            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            audio.src = src
            if (!isSafari) audio.play()
            dispatch(setCurrentSrc(src))
            dispatch(setLoading(false))
           }
          } else {
            console.log('%c OnNext: Stream', 'color: orange')
            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', { create: false })
            socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, forFuture: true })
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

        socket.emit('download-chapter', { title: current.title, chapter: current.chapter, forFuture: false })

        socket.on('audio-loaded', function ({ forFuture }) {
          socket.emit('audio-ready', { forFuture });
        });
        ss(socket).on('audio-stream', function (stream, { forFuture }) {
          let parts = [];
          stream.on('data', (chunk) => {
            parts.push(chunk);
          });
          stream.on('end', function () {
            if (forFuture) {
              const audio = document.getElementById('audio')
              console.log('Future Stream Complete')
              let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
              socket.emit('stream-done', { create: false })
              dispatch(setNextSrc(nextsrc))
            } else {
              const audio = document.getElementById('audio')
              console.log('Stream Complete')
              let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
              socket.emit('stream-done', { create: false })
              socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, forFuture: true })
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

    if (currentTime) {
      console.log('%cCurrentTime: '+ currentTime, "color: rose")
      audio.currentTime = currentTime
    }
    if (props.src) {
      console.log('%cCurrentTime: '+ currentTime, "color: rose")
      dispatch(setLoading(false))
    }

    console.log('Updating Seek, dispatch Loading to false')




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
    return <div className='player-chapter'>{chapter} / {chapters}</div>
  }
  return (
    <div className='player-controls-seek'>
      <input type="range" value={audio.currentTime} min={0} max={isNaN(duration) ? 0 : duration} onChange={onChange} />
      <div className='player-controls-text'>
        <div className="divlayer-controls-cts">{secToTime(audio.currentTime)}</div>
        <Chapter chapter={props.chapter} chapters={props.chapters} />
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
  })

  useEffect(() => {
    gsap.config({ force3D: false })
    dispatch(setLoading(true))
    setTimeout(() => setFullView(!isFullView), 1500)

    mountedTL.current = gsap.timeline()
      .from(playerBoxRef.current, 1, { y: 25, opacity: 0 }, '-=.5')
      .staggerFrom(playerBoxRef.current.children, 1, { y: 25, opacity: 0 }, .5)

    window.addEventListener('unload', function (event) {
      console.log('UNLOAD')
      dispatch(setCurrent({}))
    });



  }, []);

  const onCanPlayThrough = (e) => {
    if (current && current.time && e.target.currentTime !== current.time) e.target.currentTime = current.time

  }
  const onEnded = () => {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const audio = document.getElementById('audio');
    let isFutureLoaded = true;
    if (current.chapter < current.chapters) {

      audio.currentTime = 0;
      if (audio.src === current.nextsrc || !current.nextsrc) isFutureLoaded = false

      current = { ...current, chapter: current.chapter + 1, time: 0, src: current.nextsrc, prevsrc: current.src }

      const socket = io(proxy);
      if (isFutureLoaded) {
  
        audio.src = current.src
        if (!isSafari) audio.play()
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, forFuture: true })
      } else {
        console.log('%c Not Found', 'color: red')
        audio.src = "";
        audio.pause();
        socket.emit('download-chapter', { title: current.title, chapter: current.chapter, forFuture: false })
        dispatch(setLoading(true))
      }


      dispatch(nextChapter(current))

      axios.post(proxy + '/books/update-time/' + current._id, { time: 0 })
      axios.post(proxy + '/books/update-chapter/' + current._id, { chapter: current.chapter })
  

      // Get next chapter src
      socket.on('audio-loaded', function ({forFuture}) {
        socket.emit('audio-ready', { forFuture });
      });
      ss(socket).on('audio-stream', function (stream, { forFuture, chapter }) {
        let parts = [];
        stream.on('data', (chunk) => {
          parts.push(chunk);
        });
        stream.on('end', function () {
          if (forFuture) {
           if (store.getState().current.chapter !== chapter) {
            console.log('%c OnEnded: Future', 'color: orange')
            let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', { create: false })
            dispatch(setNextSrc(nextsrc))
            dispatch(setLoading(false))
           } else {
            socket.emit('stream-done', { create: false })
           }
          } 
          else {
            console.log('%c OnEnded: Stream', 'color: orange')
            let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts, { type: 'audio/mpeg' }))
            socket.emit('stream-done', { create: false })
            socket.emit('download-chapter', { title: current.title, chapter: current.chapter + 1, forFuture: true })
            audio.src = src
            if (!isSafari) audio.play()
            dispatch(setCurrentSrc(src))
            dispatch(setLoading(false))
          }
        })
      });
    }



  }



  const toggleView = () => {
    setFullView(!isFullView)
  }
  const PlayerText = (props) => {

    let { title, author, chapter, chapters } = props

    useEffect(() => {
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
    top: isFullView ? (isMobile ? '10vh' : '15vh') : (isMobile ? '8vh' : '10vh'),
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
          <Play title={current?.title} />
          <Next current={current} />
        </div>
        {current && <Seek currentTime={current.time} chapter={current.chapter} chapters={current.chapters} src={current.src} currentID={current._id} />}
        <audio id='audio' onEnded={onEnded} onCanPlayThrough={onCanPlayThrough}>
          {current && current.src && <source src={current.src} type="audio/mpeg"></source>}
        </audio>
      </div>
    </div>
  );
}


export default Player;