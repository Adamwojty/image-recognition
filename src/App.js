import * as React from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
const stateMachine = {
  initial: "initial",
  states: {
    initial: {
      next: "loadingModel",
    },
    loadingModel: {
      next: "awaitingUpload",
    },
    awaitingUpload: {
      next: "ready",
    },
    ready: {
      next: "classifying",
      showImage: true,
    },
    classifying: {
      next: "complete",
    },
    complete: {
      next: "awaitingUpload",
      showImage: true,
      showResults: true,
    },
  },
};

const reducer = (currentState, event) =>
  stateMachine.states[currentState][event] || stateMachine.initial;

function formatResult({ className, probability }) {
  return (
    <li key={className}>{`${className}: ${(probability * 100).toFixed(2)}`}</li>
  );
}
function App() {
  tf.setBackend("cpu");
  const [model, setModel] = React.useState(null);
  const [imgUrl, setImgUrl] = React.useState(null);
  const [results, setResults] = React.useState([]);
  const [buttonProps, setButtonProps] = React.useState({
    initial: { text: "Load Model" },
  });
  const [state, dispatch] = React.useReducer(reducer, stateMachine.initial);
  const inputRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const next = () => {
    dispatch("next");
  };
  const loadModel = async () => {
    next();
    setButtonProps({ text: "Loading Model..." });
    const mobilenetModel = await mobilenet.load();
    setModel(mobilenetModel);
    next();
    setButtonProps({
      text: "Upload Photo",
      action: () => inputRef.current.click(),
    });
  };
  const handleUpload = (e) => {
    const { files } = e.target;
    if (files.length) {
      const url = URL.createObjectURL(files[0]);
      setImgUrl(url);
      setButtonProps({ text: "Identify", action: identify });
      next();
    }
  };
  const identify = async () => {
    next();
    setButtonProps({ text: "Identifying" });
    const results = await model.classify(imgRef.current);
    setResults(results);
    next();
    setButtonProps({
      text: "Reset",
      action: resetUI,
    });
  };
  const resetUI = () => {
    setResults([]);
    setImgUrl(null);
    next();
    setButtonProps({
      text: "Upload Photo",
      action: () => inputRef.current.click(),
    });
  };

  React.useEffect(() => {
    loadModel();
  }, []);

  const { showImage = false, showResults = false } = stateMachine.states[state];
  return (
    <div className='App'>
      {showImage ? <img src={imgUrl} alt='img-preview' ref={imgRef} /> : null}
      {showResults ? <ul>{results.map(formatResult)}</ul> : null}
      <input
        type='file'
        accept='image/*'
        capture='camera'
        ref={inputRef}
        onChange={handleUpload}
      />
      <button onClick={buttonProps.action}>{buttonProps.text}</button>
    </div>
  );
}

export default App;
