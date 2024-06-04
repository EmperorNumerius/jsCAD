import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import axios from 'axios';
import 'brace/mode/javascript';
import 'brace/theme/github';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import './App.css';
import * as scad from 'scad-js';
import STLViewer from './STLViewer';

const App = () => {
  const [jsCode, setJsCode] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [stlUrl, setStlUrl] = useState('');
  const [gcodeLink, setGcodeLink] = useState('');
  const [error, setError] = useState('');
  const [filamentType, setFilamentType] = useState('PLA');
  const [printerSize, setPrinterSize] = useState('200x200x200');

  useEffect(() => {
    const scadCompletions = Object.keys(scad).map(func => {
      return {
        caption: func,
        value: func,
        meta: 'scad-js'
      };
    });

    const langTools = ace.require('ace/ext/language_tools');
    langTools.addCompleter({
      getCompletions: function(editor, session, pos, prefix, callback) {
        callback(null, scadCompletions);
      }
    });
  }, []);

  const handleConvert = async () => {
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/convert', { code: jsCode });
      if (response.data.success) {
        setDownloadLink(response.data.fileUrl);
        setStlUrl(response.data.fileUrl);
      } else {
        setError(response.data.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Error converting code:', error);
      setError('Conversion failed');
    }
  };

  const handleSlice = async () => {
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/slice', { filePath: stlUrl, filamentType, printerSize });
      if (response.data.success) {
        setGcodeLink(response.data.fileUrl);
      } else {
        setError(response.data.error || 'Slicing failed');
      }
    } catch (error) {
      console.error('Error slicing file:', error);
      setError('Slicing failed');
    }
  };

  return (
    <div className="App">
      <h1>JavaScript to OpenSCAD Converter</h1>
      <AceEditor
        mode="javascript"
        theme="github"
        name="jsCodeEditor"
        onChange={(newCode) => setJsCode(newCode)}
        value={jsCode}
        width="100%"
        height="400px"
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true
        }}
      />
      <button onClick={handleConvert}>Convert to STL</button>
      {downloadLink && (
        <div>
          <a href={downloadLink} download="model.stl">
            Download STL
          </a>
          <STLViewer url={stlUrl} />
          <div>
            <h2>Slicing Options</h2>
            <label>
              Filament Type:
              <select value={filamentType} onChange={(e) => setFilamentType(e.target.value)}>
                <option value="PLA">PLA</option>
                <option value="ABS">ABS</option>
                <option value="PETG">PETG</option>
              </select>
            </label>
            <label>
              Printer Size:
              <input
                type="text"
                value={printerSize}
                onChange={(e) => setPrinterSize(e.target.value)}
                placeholder="200x200x200"
              />
            </label>
            <button onClick={handleSlice}>Slice</button>
          </div>
          {gcodeLink && (
            <a href={gcodeLink} download="model.gcode">
              Download GCODE
            </a>
          )}
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default App;
