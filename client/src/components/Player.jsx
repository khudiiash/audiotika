import React, {useState, useEffect, useRef, createRef, memo} from 'react';
import {useDispatch, useSelector, useStore} from "react-redux";
import "./style/Player.css"
import { nextChapter } from '../redux';
import io from "socket.io-client";
import ss from "socket.io-stream";
import axios from "axios"
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, HideIcon } from '../assets/icons'
import {secToTime} from './_utils'
import './style/Inputs.css'
import gsap from 'gsap'

const Play = (props) => {
  let [isPlaying,setPlaying] = useState(false)

  useEffect(() => {
    setPlaying(false)
    let playinterval = setInterval(() => {
      const audio = document.getElementById('audio')
      if (audio && audio.src && !audio.paused && !isPlaying) {
        setPlaying(true); 
        clearInterval(playinterval);
      } 
    },1)

    return () => clearInterval(playinterval);

  }, [props.title])
 
const onPlay = () => {
    const audio = document.getElementById('audio')

    if (audio.src && !isPlaying) {
      audio.play() 
      setPlaying(isPlaying = !isPlaying)
    } else if (audio.src && isPlaying) {
      audio.pause() 
      setPlaying(isPlaying = !isPlaying)
    }
  }
  return (
    <div className='player-controls-play' id="play-button" onClick={onPlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon/>}
    </div>
  )
}

const Next = ({current}) => {

  const dispatch = useDispatch()
  const proxy = useSelector(state => state.proxy)


  const onNext = () => {
    const audio = document.getElementById('audio');
      audio.currentTime = 0;
      audio.pause()
      audio.src = undefined
      let {title, chapters} = current
      if (current.chapter + 1 <= chapters) {
      current = {...current, chapter: current.chapter + 1, time: 0}

      dispatch(nextChapter(current))

      axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
      axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})

      let socket = io(proxy);
        socket.emit('download-book', {title, chapter: current.chapter})
        socket.on('audio-loaded', function () {
             socket.emit('audio-ready');
              ss(socket).on('audio-stream', function(stream, data) {
                  let parts = [];
                  stream.on('data', (chunk) => {
                      parts.push(chunk);
                  });
                  stream.on('end', function () {
                      socket.emit('stream-done', {create: false})
                      audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
                      audio.play()                 

                  });
              });
            });
     }
  }
  return (
    <div className='player-controls-next' onClick={onNext}>
          <NextIcon />
    </div>
  )
}
const Prev = ({current}) => {
  const dispatch = useDispatch()
  const proxy = useSelector(state => state.proxy)


  const onPrev = () => {
    const audio = document.getElementById('audio');
    if (current.chapter > 1) {
      audio.currentTime = 0;
      audio.pause()
      audio.src = undefined
  
    let {title} = current
    current = {...current, chapter: current.chapter - 1, time: 0}
    dispatch(nextChapter(current))
  
    axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
    axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})
  
    let socket = io(proxy);
      socket.emit('download-book', {title, chapter: current.chapter})
      socket.on('audio-loaded', function () {
           socket.emit('audio-ready');
            ss(socket).on('audio-stream', function(stream, data) {
                let parts = [];
                stream.on('data', (chunk) => {
                    parts.push(chunk);
                });
                stream.on('end', function () {
                    socket.emit('stream-done', {create: false})
                    audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
                    audio.play()                 
  
                });
            });
          });
    } else {
      audio.currentTime = 0
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

  useEffect(() => {
    let cleanupFunction = false;
    let interval = setInterval(() => {
      if (audio && audio.duration) {
        setDuration(duration = Math.floor(audio.duration));
        console.log(secToTime(duration))
        setCurrentTime(currentTime = props.currentTime)
        if (!audio.currentTime) audio.currentTime = currentTime
        clearInterval(interval)

      }
    }, 1)

    
    audio.addEventListener('timeupdate', () => {
      if(!cleanupFunction && currentTime !==  parseInt(audio.currentTime, 10) && audio.currentTime > 0) {
        if (duration !== audio.duration) setDuration(duration = audio.duration)
        setCurrentTime( currentTime = parseInt(audio.currentTime, 10))
        axios.post(proxy + '/books/update-time/'+props.currentID, {time: currentTime})
      
      }
    })
    return () => cleanupFunction = true;
  }, [props.currentTime])

  const onSeek = ({target: {value}}) => {
    // const audio = document.getElementById('audio')
    // setCurrentTime(currentTime = parseInt(value))
    // 
  }      
  const onChange = ({target: { value }}) => {
    setCurrentTime(currentTime = parseInt(value));
    if (audio) audio.currentTime = value;
    
  }

    return (
    <div className='player-controls-seek'>
      <p className="player-controls-cts">{secToTime(audio.currentTime)}</p>
      <input type="range" value={audio.currentTime} min={0} max={duration} onChange={onChange} onMouseUp={onSeek} onTouchEnd={onSeek}/>
      <p className="player-controls-ds">{duration ? secToTime(duration) : "00:00" }</p>

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
        mountedTL.current = gsap.timeline()
        .from(playerRef.current, 1, {y: 150})
        .from(playerBoxRef.current, 1, {y: 25, opacity: 0}, '-=.5')
        .staggerFrom(playerBoxRef.current.children, 1, {y: 25, opacity: 0}, .5)

    }, []);

 
    const onEnded = () => {
    
      const audio = document.getElementById('audio');
      audio.currentTime = 0;
      audio.pause()
      audio.src = undefined
      let {title} = current
      current = {...current, chapter: current.chapter + 1, time: 0}

      dispatch(nextChapter(current))

      axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
      axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})

      let socket = io(proxy);
        socket.emit('download-book', {title, chapter: current.chapter})
        socket.on('audio-loaded', function () {
             socket.emit('audio-ready');
              ss(socket).on('audio-stream', function(stream, data) {
                  let parts = [];
                  stream.on('data', (chunk) => {
                      parts.push(chunk);
                  });
                  stream.on('end', function () {
                      socket.emit('stream-done', {create: false})
                      audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));
                      audio.play()                 

                  });
              });
            });
    }

    const toggleView = () => {
      setFullView(!isFullView)
    }
    const PlayerText = (props) => {
    
      let {title, author, chapter, chapters} = props  
    
      useEffect(()=> {
          if (!mounted)
          newBookTL.current = gsap.timeline()
          .staggerFrom(playerTextRef.current.children, 1, {y: 25, opacity: 0}, .4)
          .call(() => setMounted(true))
         
      }, [])
    
      const Chapter = (props) => {
        let {chapter, chapters} = props
        return <><div className='player-chapter'>{chapter} / {chapters}</div></>
      }
      return <div className='player-text' ref={playerTextRef}>
        <div className='player-title'>{title}</div>
        <div className='player-author'>{author}</div>
        <Chapter chapter={chapter} chapters={chapters}/>
      </div>
    }
   
    
    let playerBoxStyle = {
      top: isFullView ? (isMobile ? '10vh' : '15vh') : (isMobile ? '7vh' : '10vh'), 
      height: isFullView ? (isMobile ? "80vh" : "60vh") : (isMobile ? "60vh" : "60vh")
    }
    
    let playerStyle = {
      top: isFullView ? (isMobile ? "-30vh" : "-22vh") : (isMobile ?  "-5vh" : '-5vh')
    }
   

    return (
        <div id='player' className="player" style={playerStyle} ref={playerRef}>
          <div className="player-hide" style={{transform: isFullView ? "rotate(0)" : "rotate(180deg)"}}onClick={toggleView}><HideIcon/></div>
          <div className="player-box" style={playerBoxStyle} ref={playerBoxRef}>

           {current && <PlayerText title={current.title} author={current.author} chapter={current.chapter} chapters={current.chapters} />}
           <div className="player-controls">
              <Prev current={current}/>
              <Play title={current?.title}/>
              <Next  current={current}/>
           </div>
              {current && <Seek currentTime={current.time} currentID={current._id}/>}
            <audio id='audio' onEnded={onEnded}>         
              <source src={current && current.src} type="audio/mpeg"></source>
            </audio>
          </div>
        </div>
    );
}


export default Player;