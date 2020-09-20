import React, {useState} from "react";
import { useDispatch } from "react-redux";
import { addArticle } from "../redux"



function Form() {
    const dispatch = useDispatch();
    let [title, updateTitle] = useState("")
    const handleChange = (e) => {
       updateTitle(title = e.target.value)
    }
    const handleSubmit = (e) => {
        e.preventDefault()
        dispatch(addArticle({title}))
        updateTitle(title = "")
    }
    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="title">Title</label>
                <input type="text" id="title" value={title} onChange={handleChange}/>
            </div>
            <button type='submit'>SAVE</button>
        </form>
    );
}

export default Form;