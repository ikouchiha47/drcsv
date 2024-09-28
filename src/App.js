import React, { useState } from 'react';

import { registerAllModules } from 'handsontable/registry';

import './App.css';
import './Home.css';

// import WareHouse from './WareHouse';
// import DataTable from './DataTable';
// import AnalysisTables from './AnalysisTables';
// import SQLComponent from './SQLComponent';

import { FileUpload } from './components/FileUpload';
import WorkSpace from './components/Workspace';
import Logo from './Logo';
import HeroSection from './components/HeroSection';

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

registerAllModules();

function FaqLink() {
  return (
    <a
      className='nav-faq-header glass-button'
      href='/faq.html'
      target="__blank"
      rel="noopener noreferrer"
    >
      Faq
    </a>
  )
}

function Header({ handleFileUpload }) {
  return (
    <header className="App-header">
      <a
        className="App-link"
        href="http://localhost:3000"
        rel="noopener noreferrer"
      >
        <Logo fillColor='#61dafb' width='200' height='100' />
      </a>
      <nav className='flex flex-row' style={{ gap: '16px' }}>
        {/*<FaqLink />*/}
        <FileUpload handleFileUpload={handleFileUpload} wrapperClass='Upload-container' />
      </nav>
    </header>
  )
}

function App() {
  const [isLoaded, setLoaded] = useState(false);
  const [file, setFile] = useState(null);
  const [files, updateFiles] = useState(new Map());

  const onFileUpload = async (event) => {
    const files = event.target.files;

    if (!files) return;
    if (!files.length) return;

    updateFiles(prevFiles => {
      let newMap = new Map(prevFiles);

      return [...files].reduce((acc, file) => {
        acc.set(file.name, file)
        return acc;
      }, newMap)
    })

    setFile(files[0]);

    if (!isLoaded) {
      setLoaded(true)
    }
  }

  const onFileSelected = (file) => {
    setFile(file);
  }

  const onRemoveFile = (selectedFile) => {
    let nFiles = files.length;

    if (nFiles === 1 && selectedFile.name === file.name) { // this is the last file, so happily unload everything
      setFile(null)
      updateFiles(new Map());

      return;
    }

    console.log(file.name, "now file");

    let newFileList = new Map(files);
    newFileList.delete(selectedFile.name);

    let nextFile = Array.from(newFileList.keys())[0];
    console.log("new file", newFileList.get(nextFile))

    updateFiles(newFileList)
    // setFile(newFileList.get(nextFile))

    //TODO: fix this later
    // setFile doesn't update the WorkSpace
    setTimeout(() => {
      setFile(newFileList.get(nextFile))
    }, 0)
  }

  return (
    <div className="App">
      <Header handleFileUpload={onFileUpload} />
      <section className='App-container'>
        {!isLoaded ? <HeroSection /> : null}
        {isLoaded && file && (
          <WorkSpace
            files={files}
            handleSelectFile={onFileSelected}
            handleRemoveFile={onRemoveFile}
            file={file} />
        )}
      </section>
    </div>
  )
}

export default App;
