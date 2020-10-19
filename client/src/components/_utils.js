
export function secToTime(d) {
    if (d >= 0 && isFinite(d)) {
        let isHour = Math.floor(d / 3600)
        let isMinute = Math.floor(d % 3600 / 60)
    
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
    
        var hDisplay = h.toString()+':' ;
        var mDisplay = m.toString()+':';
        var sDisplay = s.toString()
        return isHour ? hDisplay + (m < 10 && isHour ? "0"+mDisplay : mDisplay) + (s < 10 ? "0"+sDisplay : sDisplay) : isMinute ? mDisplay + (s < 10 ? "0"+sDisplay : sDisplay) : "00:" + (s < 10 ? "0"+sDisplay : sDisplay);

    } else return "00:00"
   
}

export function varify({username, email, password}) {
    let errors = {username: "", email: "", password: "", any: false}
    if  (!/\@\w+\.(com|net|ua)$/.test(email)) {
        errors.email = "Incorrect Email Format: example@mail.com";
        errors.any = true;
    }
    if  (username.length < 4) {
        errors.username = "Short username, 4 characters minimum";
        errors.any = true;
    }
    if  (password.length < 8) {
        errors.password = "Short password, 8 characters minimum";
        errors.any = true;
    }
    if (((password && username) || (password && email)) && (password === username || password === email)) {
        errors.password = "Password must not duplicate your username or email"
        errors.any = true;
    }
    if (!password) {
        errors.password = 'You forgot to fill in the password'
    }
    if (!email) {
        errors.email = 'You forgot to fill in your email'
    }
    if (!username) {
        errors.username = 'You forgot to mention your username'
    }
    return errors
}

export function b64(e){var t="";var n=new Uint8Array(e);var r=n.byteLength;for(var i=0;i<r;i++){t+=String.fromCharCode(n[i])}return window.btoa(t)}


