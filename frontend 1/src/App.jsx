import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import './App.css';

const templates = {
  basic: {
    html: "<div class='centered'>Hello World</div>",
    css: "body { background: #f5f5f5; } .centered { font-size: 2em; text-align: center; margin-top: 20vh; }",
    js: "console.log('Hello World');"
  },
  dark: {
    html: "<div class='container'>Dark Theme</div>",
    css: "body { background: #121212; color: #fff; } .container { padding: 20px; font-family: sans-serif; }",
    js: "document.body.style.fontFamily = 'monospace';"
  }
};

export default function App() {
  const [html, setHtml] = useState(templates.basic.html);
  const [css, setCss] = useState(templates.basic.css);
  const [js, setJs] = useState(templates.basic.js);
  const [srcDoc, setSrcDoc] = useState('');
  const [layout, setLayout] = useState('side');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && id !== 'null' && id !== 'undefined') {
      axios.get(`http://localhost:3001/load/${id}`)
        .then(res => {
          setHtml(res.data.html);
          setCss(res.data.css);
          setJs(res.data.js);
        })
        .catch(() => {
          console.warn('Snippet not found');
          setSearchParams({});
        });
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const combined = `
        <html>
          <head><style>${css}</style></head>
          <body>
            ${html}
            <script>${js}<\/script>
          </body>
        </html>
      `;
      setSrcDoc(combined);
    }, 250);
    return () => clearTimeout(timeout);
  }, [html, css, js]);

  const saveCode = async () => {
    try {
      const res = await axios.post('http://localhost:3001/save', { html, css, js });
      const newUrl = `${window.location.origin}?id=${res.data.id}`;
      navigator.clipboard.writeText(newUrl);
      alert('Link copied to clipboard: ' + newUrl);
      setSearchParams({ id: res.data.id });
    } catch (err) {
      alert('Error saving snippet');
    }
  };

  const downloadCode = () => {
    const data = { html, css, js };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'code-snippet.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const changeTemplate = (name) => {
    const template = templates[name];
    setHtml(template.html);
    setCss(template.css);
    setJs(template.js);
  };

  return (
    <div className="editor-container">
      <header className="header">
        <h1>🧪 Online Code Editor</h1>
        <div className="controls">
          <select onChange={e => changeTemplate(e.target.value)}>
            <option value="basic">Basic Template</option>
            <option value="dark">Dark Template</option>
          </select>
          <select value={layout} onChange={e => setLayout(e.target.value)}>
            <option value="side">🖥️ Side-by-side</option>
            <option value="full">🔲 Full Preview</option>
          </select>
          <button className="save-btn" onClick={saveCode}>💾 Save & Share</button>
          <button onClick={downloadCode}>📥 Download</button>
        </div>
      </header>

      <div className={`panes ${layout}`}>
        {layout === 'side' && (
          <div className="pane editors">
            <div className="editor-block">
              <label>HTML</label>
              <Editor height="200px" language="html" value={html} onChange={value => setHtml(value)} theme="vs-dark" />
            </div>
            <div className="editor-block">
              <label>CSS</label>
              <Editor height="200px" language="css" value={css} onChange={value => setCss(value)} theme="vs-dark" />
            </div>
            <div className="editor-block">
              <label>JavaScript</label>
              <Editor height="200px" language="javascript" value={js} onChange={value => setJs(value)} theme="vs-dark" />
            </div>
          </div>
        )}

        <div className="pane preview">
          <iframe
            srcDoc={srcDoc}
            title="Live Preview"
            sandbox="allow-scripts allow-forms allow-same-origin"
            frameBorder="0"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
