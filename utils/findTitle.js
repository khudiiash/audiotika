module.exports =  function findTitle(torrentName) {
   if (torrentName.includes('-')) return torrentName.split('- ')[1].split(' [')[0] || "..."
   else if (torrentName.includes('–')) return torrentName.split('– ')[1].split(' [')[0] || "..."
   else return


}