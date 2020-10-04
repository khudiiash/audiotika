module.exports =  function findTitle(torrentName) {
   try {
      if (torrentName.includes('- ')) return torrentName.split('- ')[1].split(' [')[0].trim()
      else if (torrentName.includes('– ')) return torrentName.split('– ')[1].split(' [')[0].trim()
      else return
   } catch {
      console.log('Title Error in', torrentName)
      return
   }
  


}