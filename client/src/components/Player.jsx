import React, {useState, useEffect, useRef, createRef, memo} from 'react';
import {useDispatch, useSelector, useStore} from "react-redux";
import "./style/Player.css"
import { nextChapter, setCurrent, setNextSrc, setCurrentSrc} from '../redux';
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
  const proxy = useSelector(state => state.proxy)
  const dispatch = useDispatch()


  const onNext = () => {
    const audio = document.getElementById('audio');

    if (current.chapter < current.chapters) {
      audio.currentTime = 0;
      audio.src = current.nextsrc
      audio.play()
      let {title, chapter, src, nextsrc} = current
      current = {...current, chapter: chapter + 1, time: 0, src: nextsrc, prevsrc: src}
      axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
      axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})

      dispatch(nextChapter(current))
      dispatch(setCurrent(current))

      // Get next chapter src
      const socket = io(proxy);
    
      socket.emit('download-chapter', {title, chapter: current.chapter + 1, forFuture: true})

      socket.on('audio-loaded', function (data) {
        socket.emit('audio-ready', {forFuture: true});
      });
      ss(socket).on('audio-stream', function(stream, {forFuture}) {
          let parts = [];
          stream.on('data', (chunk) => {
              parts.push(chunk);
          });
          stream.on('end', function () {
              const audio = document.getElementById('audio')
                  console.log('Future Stream Complete')
                  let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                  socket.emit('stream-done', {create: false})
                       dispatch(setNextSrc(nextsrc))
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
const Prev = ({current}) => {
  const dispatch = useDispatch()
  const proxy = useSelector(state => state.proxy)

  const onPrev = () => {
    const audio = document.getElementById('audio');
    
    if (current.chapter > 1) {
      if (current.prevsrc) {
        current.nextsrc = current.src
        current.src = current.prevsrc
        current.prevsrc = undefined
        current.time = 0
        current.chapter -= 1,
  
        audio.currentTime = 0;
  
        audio.src = current.src
        audio.play()
        axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
        axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})
  
        console.log(current)
        dispatch(setCurrent(current))



      } else {

      current.time = 0
      audio.pause()
      current.chapter -= 1, 

      dispatch(nextChapter(current))
      axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
      axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})


      audio.currentTime = 0;

      const socket = io(proxy);
    
      socket.emit('download-chapter', {title: current.title, chapter: current.chapter, forFuture: false})

      socket.on('audio-loaded', function ({forFuture}) {
        socket.emit('audio-ready', {forFuture});
      });
      ss(socket).on('audio-stream', function(stream, {forFuture}) {
          let parts = [];
          stream.on('data', (chunk) => {
              parts.push(chunk);
          });
          stream.on('end', function () {
            console.log(forFuture)
            if (forFuture) {
              const audio = document.getElementById('audio')
              console.log('Future Stream Complete')
              let nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
              socket.emit('stream-done', {create: false})
              dispatch(setNextSrc(nextsrc))
            } else {
              const audio = document.getElementById('audio')
              console.log('Stream Complete')
              let src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
              socket.emit('stream-done', {create: false})
              socket.emit('download-chapter', {title: current.title, chapter: current.chapter + 1, forFuture: true})
              audio.src = src
              audio.play()

              dispatch(setCurrentSrc(src))

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

  useEffect(() => {
    let cleanupFunction = false;
    let interval = setInterval(() => {
      concole.log('checking audio, ', audio)
      if (audio && audio.duration) {
        setDuration(duration = Math.floor(audio.duration));
        console.log(secToTime(duration))
        setCurrentTime(currentTime = props.currentTime)
        if (!audio.currentTime && currentTime) audio.currentTime = currentTime
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

 
  const onChange = ({target: { value }}) => {
    setCurrentTime(currentTime = parseInt(value));
    if (audio) audio.currentTime = value;
    
  }

    return (
    <div className='player-controls-seek'>
      <p className="player-controls-cts">{secToTime(audio.currentTime)}</p>
      <input type="range" value={audio.currentTime} min={0} max={duration} onChange={onChange} />
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
    console.log('%c Player', 'color: green')

    useEffect(() => {
        gsap.config({force3D: false})


        mountedTL.current = gsap.timeline()
        .from(playerRef.current, 1, {y: 150})
        .from(playerBoxRef.current, 1, {y: 25, opacity: 0}, '-=.5')
        .staggerFrom(playerBoxRef.current.children, 1, {y: 25, opacity: 0}, .5)


        return () => {
          console.log('Unmount')
        }

    }, []);

   

   
     

 
    const onEnded = () => {
      const audio = document.getElementById('audio');
      audio.currentTime = 0;
      audio.src = current.nextsrc
      audio.play()
      if (current.chapter + 1 <= current.chapters) {
      let {title, chapter, src, nextsrc} = current;
      current = {...current, chapter: chapter + 1, time: 0, src: nextsrc, prevsrc: src}
      const socket = io(proxy);
      socket.on('audio-loaded', function (data) {
        socket.emit('audio-ready', {forFuture: true});
      });
      ss(socket).on('audio-stream', function(stream, {forFuture}) {
          let parts = [];
          stream.on('data', (chunk) => {
              parts.push(chunk);
          });
          stream.on('end', function () {
              const audio = document.getElementById('audio')
                  console.log('Future Stream Complete')
                  current.nextsrc = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
                  socket.emit('stream-done', {create: false})
                  axios.get(proxy + '/books/'+current._id)
                  .then(res => {
                      dispatch(setCurrent(current))
                  })
          });
    });
      dispatch(nextChapter(current))

      axios.post(proxy + '/books/update-time/'+current._id, {time: 0})
      axios.post(proxy + '/books/update-chapter/'+current._id, {chapter: current.chapter})


      if (current && current.chapter < current.chapters) {
        //Downdload future chapter
         socket.emit('download-chapter', {title, chapter: current.chapter + 1, forFuture: true})
      }
     }
      

     
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