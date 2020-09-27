module.exports =  function findTitle(torrentName) {
   if (torrentName.includes('-')) return torrentName.split('- ')[1].split(' [')[0].trim()
   else if (torrentName.includes('–')) return torrentName.split('– ')[1].split(' [')[0].trim()
   else return


}