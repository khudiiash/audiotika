module.exports =  function findAuthor(torrentName) {
    if  (torrentName.includes('-')) return torrentName.split(' -')[0].split(' ')[1]+' '+torrentName.split(' -')[0].split(' ')[0]
    else if  (torrentName.includes('–')) return torrentName.split(' –')[0].split(' ')[1]+' '+torrentName.split(' –')[0].split(' ')[0]
    else return

        
}