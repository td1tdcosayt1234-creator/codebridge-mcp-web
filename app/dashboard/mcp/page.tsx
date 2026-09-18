"use client";
export default function McpPage(){
  return (<div><h2>Connect your agent — no keys needed</h2><div className="card"><p className="muted small">Add the entry below to your agent config, stay logged in on this website, restart the agent app — done. No headers, no keys to paste.</p><pre>{`{
  "mcp": {
    "codebridge": {
      "type": "remote",
      "url": "/api/mcp"
    }
  }
}`}</pre><p className="muted small">Replace the URL with your public domain after deploy.</p></div></div>);
}
