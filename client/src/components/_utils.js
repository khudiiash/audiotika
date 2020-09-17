
export function secToTime(d) {
    let isHour = Math.floor(d / 3600)
    let isMinute = Math.floor(d % 3600 / 60)


    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h.toString()+':' ;
    var mDisplay = m.toString()+':';
    var sDisplay = s.toString()

  
    return isHour ? hDisplay + (mDisplay < 10 ? "0"+mDisplay : mDisplay) + (sDisplay < 10 ? "0"+sDisplay : sDisplay) : isMinute ? (mDisplay < 10 ? "0"+mDisplay : mDisplay) + (sDisplay < 10 ? "0"+sDisplay : sDisplay) : "00:" + (sDisplay < 10 ? "0"+sDisplay : sDisplay);
}
export function b64(e){var t="";var n=new Uint8Array(e);var r=n.byteLength;for(var i=0;i<r;i++){t+=String.fromCharCode(n[i])}return window.btoa(t)}


