module.exports =  function findAuthor(torrentName) {
    try {
    if  (torrentName.includes(' -')) return torrentName.split(' -')[0].split(' ')[1]+' '+torrentName.split(' -')[0].split(' ')[0].trim()
    else if  (torrentName.includes(' –')) return torrentName.split(' –')[0].split(' ')[1]+' '+torrentName.split(' –')[0].split(' ')[0].trim()
    else return
    } catch {
        console.log('Author Error in', torrentName)
        return
    }
        
}