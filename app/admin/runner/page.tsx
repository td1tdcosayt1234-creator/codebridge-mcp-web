"use client"; import { useEffect, useState } from "react";
const YAML = `name: opencode-task
on:
  workflow_dispatch:
    inputs:
      task_id:
        description: 'CodeBridge task id'
        required: true
jobs:
  agent:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      models: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install opencode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH
      - name: Pull task from web
        run: |
          WEB="\${WEB_URL%/}"
          curl -sf -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" \
            "$WEB/api/runner/next?task_id=\${{ inputs.task_id }}" -o task.json
          cat task.json
        env:
          WEB_URL: \${{ secrets.WEB_URL }}
      - name: Write task files (isolated task-work/ dir e)
        run: |
          node -e "
          const fs=require('fs');
          const t=JSON.parse(fs.readFileSync('task.json','utf8'));
          for(const f of (t.files||[])){const p='task-work/'+f.path;fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,f.content);}
          console.log('files:',(t.files||[]).length,'kind:',t.kind);
          "
          ls task-work 2>/dev/null || echo "(no files — prompt-only task)"
      - name: Run opencode (free local Ollama, no API key)
        run: |
          node -e "const t=require('./task.json');require('fs').writeFileSync('prompt.txt',t.prompt)"
          KIND=$(node -e "console.log(require('./task.json').kind||'compile')")
          # Ollama local (100% free, unlimited, no key) — api key lagbe na
          curl -fsSL https://ollama.com/install.sh | sh
          (ollama serve > ollama.log 2>&1 &) 
          sleep 5
          ollama pull qwen2.5-coder:1.5b
          node -e "require('fs').writeFileSync('opencode.json', JSON.stringify({\$schema:'https://opencode.ai/config.json', provider:{ ollama:{ npm:'@ai-sdk/openai-compatible', name:'Ollama (local free)', options:{ baseURL:'http://localhost:11434/v1' }, models:{ 'qwen2.5-coder:1.5b':{ name:'Qwen2.5-Coder 1.5B (local free)' } } } } }, null, 2))"
          cat opencode.json
          # fix-compile mode retries up to 3 times, compile mode runs once
          MAX_TRY=1
          if [ "$KIND" = "fix-compile" ]; then MAX_TRY=3; fi
          echo "kind=$KIND max_try=$MAX_TRY model=ollama/qwen2.5-coder:1.5b"
          : > agent.log
          EXIT_CODE=1
          for i in $(seq 1 $MAX_TRY); do
            echo "=== attempt $i/$MAX_TRY ($KIND) ===" | tee -a agent.log
            opencode run --auto -m ollama/qwen2.5-coder:1.5b "$(cat prompt.txt)" 2>&1 | tee -a agent.log
            EXIT_CODE=\${PIPESTATUS[0]}
            echo "attempt $i exit=$EXIT_CODE" | tee -a agent.log
            if [ "$EXIT_CODE" = "0" ]; then break; fi
            if [ "$KIND" != "fix-compile" ]; then break; fi
            echo "Retrying with fix context..." | tee -a agent.log
          done
          echo "final_exit=$EXIT_CODE" | tee -a agent.log
          echo "$EXIT_CODE" > exit.code
      - name: Set up Java 17 (Android project thakle only)
        if: \${{ hashFiles('task-work/settings.gradle', 'task-work/build.gradle', 'task-work/app/build.gradle', 'task-work/**/AndroidManifest.xml') != '' }}
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - name: Set up Android SDK (compileSdk 34)
        if: \${{ hashFiles('task-work/settings.gradle', 'task-work/build.gradle', 'task-work/app/build.gradle', 'task-work/**/AndroidManifest.xml') != '' }}
        uses: android-actions/setup-android@v3
      - name: Set up Python (Python project thakle only)
        if: \${{ hashFiles('task-work/requirements.txt', 'task-work/pyproject.toml', 'task-work/setup.py', 'task-work/setup.cfg', 'task-work/**/*.py') != '' }}
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Set up Go (Go project thakle only)
        if: \${{ hashFiles('task-work/go.mod') != '' }}
        uses: actions/setup-go@v5
        with:
          go-version: 'stable'
      - name: Real build (project type onujayi — Android/Node/Python/Go/Rust)
        if: always()
        run: |
          BUILD_RAN=0
          mark_fail() { if [ -f exit.code ] && [ "$(cat exit.code)" = "0" ]; then echo "1" > exit.code; fi; echo "override: AI exit 0 kintu real $1 fail -> task failed" | tee -a agent.log; }
          W=task-work
          # ---- Android Gradle ----
          if [ -f $W/settings.gradle ] || [ -f $W/build.gradle ] || [ -f $W/app/build.gradle ] || find $W -name AndroidManifest.xml -print -quit 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== REAL GRADLE BUILD (assembleDebug) ===" | tee -a agent.log
          java -version 2>&1 | tee -a agent.log
          export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
          (sdkmanager --install "platforms;android-34" "build-tools;34.0.0" 2>&1 | tail -n 3 || echo "sdkmanager skip (preinstalled SDK)") | tee -a agent.log
          yes | sdkmanager --licenses > /dev/null 2>&1 || true
          if [ -f ./gradlew ]; then chmod +x ./gradlew; GRADLE_CMD="./gradlew -p $W"; else curl -fsSL https://services.gradle.org/distributions/gradle-8.7-bin.zip -o /tmp/gradle.zip && unzip -q /tmp/gradle.zip -d /tmp && export PATH=/tmp/gradle-8.7/bin:$PATH; GRADLE_CMD="gradle -p $W"; fi
          echo "gradle-cmd=$GRADLE_CMD java=17 kotlin=1.9.24 agp=8.5.2 compileSdk=34 dir=$W" | tee -a agent.log
          $GRADLE_CMD assembleDebug --stacktrace 2>&1 | tee gradle-build.log | tail -n 60 | tee -a agent.log
          echo "\${PIPESTATUS[0]}" > gradle-exit.code
          echo "gradle-exit=$(cat gradle-exit.code)" | tee -a agent.log
          APK=$(find . -name "*.apk" -path "*debug*" 2>/dev/null | head -n 5)
          echo "apk-files:" | tee -a agent.log; echo "$APK" | tee -a agent.log
          # Full gradle log artifact e jabe (gradle-build.log), agent.log e sudhu tail-60 —
          # nahole 15000-char slice + coin charge bloat hoy (19-coin test e 7500 katsilo).
          # AI exit code er sathe real gradle verdict merge: gradle fail hole task failed
          if [ "$(cat gradle-exit.code)" != "0" ]; then mark_fail "gradle"; fi
          fi
          # ---- Node (package.json) ----
          if [ -f $W/package.json ]; then
            BUILD_RAN=1
            echo "=== REAL NODE BUILD (dir=$W) ===" | tee -a agent.log
            (npm --prefix $W ci 2>&1 || npm --prefix $W install 2>&1) | tail -n 10 | tee -a agent.log
            if node -e "process.exit(require('./$W/package.json').scripts && require('./$W/package.json').scripts.build ? 0 : 1)"; then
              npm --prefix $W run build 2>&1 | tee node-build.log | tail -n 40 | tee -a agent.log
              if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "node-build"; else echo "node-build-exit=0" | tee -a agent.log; fi
            else
              echo "no build script — deps install only, AI verdict stands" | tee -a agent.log
            fi
          fi
          # ---- Python (.py / requirements.txt / pyproject.toml) ----
          if ls $W/*.py >/dev/null 2>&1 || [ -f $W/requirements.txt ] || [ -f $W/pyproject.toml ] || [ -f $W/setup.py ] || find $W -name "*.py" -not -path "$W/node_modules/*" -print -quit 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== REAL PYTHON BUILD (py_compile, dir=$W) ===" | tee -a agent.log
            if [ -f $W/requirements.txt ]; then pip install -r $W/requirements.txt 2>&1 | tail -n 5 | tee -a agent.log; fi
            PYFILES=$(find $W -name "*.py" -not -path "$W/node_modules/*" -not -path "$W/.git/*" 2>/dev/null)
            if [ -n "$PYFILES" ]; then
              python3 -m py_compile $PYFILES 2>&1 | tee py-build.log | tail -n 30 | tee -a agent.log
              if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "python-compile"; else echo "python-compile-exit=0" | tee -a agent.log; fi
            fi
            if [ -f $W/pytest.ini ] || [ -d $W/tests ] || find $W -name "test_*.py" -print -quit 2>/dev/null | grep -q .; then
              (cd $W && python3 -m pytest -q) 2>&1 | tail -n 20 | tee -a agent.log || mark_fail "pytest"
            fi
          fi
          # ---- Go (go.mod) ----
          if [ -f $W/go.mod ]; then
            BUILD_RAN=1
            echo "=== REAL GO BUILD (dir=$W) ===" | tee -a agent.log
            (cd $W && go build ./...) 2>&1 | tee ../go-build.log | tail -n 30 | tee -a agent.log
            if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "go-build"; else echo "go-build-exit=0" | tee -a agent.log; fi
          fi
          # ---- Rust (Cargo.toml) ----
          if [ -f $W/Cargo.toml ]; then
            BUILD_RAN=1
            echo "=== REAL RUST BUILD (dir=$W) ===" | tee -a agent.log
            (cd $W && cargo build) 2>&1 | tee ../rust-build.log | tail -n 30 | tee -a agent.log
            if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "cargo-build"; else echo "cargo-build-exit=0" | tee -a agent.log; fi
          fi
          if [ "$BUILD_RAN" = "0" ]; then
            echo "skip: kono known project type na (Android/Node/Python/Go/Rust marker nei) — AI verdict stands" | tee -a agent.log
          fi
      - name: Send APK to web (thakle — web theke agent download korbe)
        if: always()
        run: |
          APK=$(find . -name "*.apk" -path "*debug*" 2>/dev/null | head -n 1)
          if [ -n "$APK" ]; then
            echo "uploading $APK ($(du -h "$APK" | cut -f1))"
            WEB="\${WEB_URL%/}"
            curl -sf -X POST -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" --data-binary "@$APK" "$WEB/api/runner/apk?task_id=\${{ inputs.task_id }}"
            echo "apk-sent=$?"
          else
            echo "no apk (non-Android ba build fail)"
          fi
        env:
          WEB_URL: \${{ secrets.WEB_URL }}
          RUNNER_TOKEN: \${{ secrets.RUNNER_TOKEN }}
      - name: Send result to web
        if: always()
        run: |
          node -e "
          const fs=require('fs');
          const ok=fs.existsSync('agent.log');
          const log=ok?fs.readFileSync('agent.log','utf8').slice(-15000):'no log';
          let code=1; try{ code=parseInt(fs.readFileSync('exit.code','utf8').trim(),10); }catch{}
          const base=(process.env.WEB_URL||'').replace(/\/+$/,'');
          fetch(base+'/api/runner/update',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.RUNNER_TOKEN},body:JSON.stringify({id:'\${{ inputs.task_id }}',status:(ok&&code===0)?'done':'failed',log,result:log})}).then(async r=>{console.log('sent',r.status); if(!r.ok) console.log(await r.text());});
          "
        env:
          WEB_URL: \${{ secrets.WEB_URL }}
          RUNNER_TOKEN: \${{ secrets.RUNNER_TOKEN }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-\${{ inputs.task_id }}-log
          path: |
            agent.log
            gradle-build.log
          if-no-files-found: warn
      - name: Upload APK (agar build success hoy)
        if: always()
        run: |
          ls -lh task-work/app/build/outputs/apk/debug/ 2>/dev/null || echo "no apk dir (gradle fail hole APK thakbe na)"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-\${{ inputs.task_id }}-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: warn
`;
export default function AdminRunner(){
  const [st,setSt]=useState<any>(null); const [repo,setRepo]=useState(""); const [wf,setWf]=useState("opencode-task.yml"); const [msg,setMsg]=useState(""); const [newToken,setNewToken]=useState("");
  async function load(){ const r=await fetch("/api/admin/runner"); const j=await r.json(); setSt(j); if(j.builderRepo!==undefined){ setRepo(j.builderRepo||""); setWf(j.builderWorkflow||"opencode-task.yml"); } }
  useEffect(()=>{load();},[]);
  async function save(e:any){ e.preventDefault(); const r=await fetch("/api/admin/runner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({builderRepo:repo,builderWorkflow:wf})}); setMsg(r.ok?"Saved.":"Failed"); load(); }
  async function regen(){ if(!confirm("Generate a new runner token? The old token will stop working.")) return; const r=await fetch("/api/admin/runner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({regenerate:true})}); const j=await r.json(); if(r.ok){ setNewToken(j.token); setMsg("Shown only once — copy it into the repo secret now."); } load(); }
  if(!st) return <p className="muted">Loading...</p>;
  if(st.error) return <p>Admin only. <a href="/login">Login</a></p>;
  return (<div>
    <h2>Runner — OpenCode in Actions</h2>
    <p className="muted small">Users send requests on the web → the web dispatches the workflow on the builder repo → OpenCode runs in Actions → output returns to the web → users read it. Users never touch repos.</p>
    <div className="grid g2">
      <div className="card"><h3>1️⃣ Builder repo</h3><form onSubmit={save}>
        <label>Builder repo (owner/repo) — the workflow file must live here</label><input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="owner/repo"/>
        <label>Workflow file</label><input value={wf} onChange={e=>setWf(e.target.value)}/>
        <div style={{marginTop:10}}><button className="btn">Save</button></div></form>{msg&&<p className="small">{msg}</p>}
        <p className="muted small">Status: queued {st.counts?.queued||0} • running {st.counts?.running||0} • done {st.counts?.done||0} • failed {st.counts?.failed||0}</p></div>
      <div className="card"><h3>2️⃣ Runner token {st.tokenConfigured?<span className="badge ok">set</span>:<span className="badge bad">not set</span>}</h3>
        <p className="muted small">Add it as the <code>RUNNER_TOKEN</code> secret in the builder repo.</p>
        <button className="btn-ghost" onClick={regen}>Regenerate token</button>
        {newToken&&<pre style={{marginTop:8}}>{newToken}</pre>}</div>
    </div>
    <div className="card" style={{marginTop:12}}><h3>3️⃣ Workflow file — create <code>.github/workflows/{wf||"opencode-task.yml"}</code> in the builder repo</h3>
      <p className="muted small">Required repo secrets: <code>WEB_URL</code> (public URL — localhost is unreachable from GitHub runners, otherwise use a self-hosted runner on your PC), <code>RUNNER_TOKEN</code> (above), <code>ANTHROPIC_API_KEY</code> (model key for OpenCode). Adjust the model line to yours.</p>
      <pre>{YAML}</pre></div>
    <div className="card" style={{marginTop:12}}><h3>Recent tasks</h3>
      {(st.recent||[]).length===0&&<p className="muted small">No tasks yet.</p>}
      {(st.recent||[]).map((t:any)=>(<div key={t.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0"}}><span className="badge">{t.status}</span> <b>{t.title}</b> <span className="muted">{t.id} • user {t.userId} • charged {t.tokensCharged||0}</span></div>))}
    </div>
  </div>);
}
