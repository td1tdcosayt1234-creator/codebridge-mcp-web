"use client"; import { useEffect, useState } from "react";
export default function McpPage(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  const key=d?.key||"";
  return (<div><h2>MCP Key</h2><div className="card"><p className="muted small">Use as Bearer in opencode.json remote MCP.</p><pre>{key||"login required"}</pre><pre>{`{\n  "mcp": {\n    "codebridge": {\n      "type": "remote",\n      "url": "/api/mcp",\n      "headers": { "Authorization": "Bearer ${key||"PASTE_KEY"}" }\n    }\n  }\n}`}</pre></div></div>);
}
