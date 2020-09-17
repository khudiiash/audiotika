import React from 'react';
import {useStore} from 'react-redux'
import {Header, BookList, Player} from './_components'

function Home() {
    return (<>
            <Header/>
            <BookList />
            <Player />
        </>
    );
}

export default Home;