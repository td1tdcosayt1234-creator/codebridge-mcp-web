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
      - name: Set up Java 17 (Android/Java/Maven/Gradle project hole)
        if: \${{ hashFiles('task-work/settings.gradle', 'task-work/build.gradle', 'task-work/build.gradle.kts', 'task-work/pom.xml', 'task-work/app/build.gradle', 'task-work/**/AndroidManifest.xml', 'task-work/**/*.java') != '' }}
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
      - name: Real build (project type auto-detect)
        if: always()
        run: |
          BUILD_RAN=0
          mark_fail() { if [ -f exit.code ] && [ "$(cat exit.code)" = "0" ]; then echo "1" > exit.code; fi; echo "override: AI exit 0 kintu real $1 fail -> task failed" | tee -a agent.log; }
          W=task-work
          NATIVE_BIN=""
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
              echo "no build script - trying entry file (25s timeout) ..." | tee -a agent.log
              ENTRY=$(node -e "try{console.log(require('./$W/package.json').main||'')}catch(e){console.log('')}")
              if [ -z "$ENTRY" ]; then for c in index.js server.js app.js main.js src/index.js src/server.js; do if [ -f "$W/$c" ]; then ENTRY="$c"; break; fi; done; fi
              if [ -n "$ENTRY" ] && [ -f "$W/$ENTRY" ]; then
                echo "run: node $ENTRY (dir=$W)" | tee -a agent.log
                ( cd $W && timeout 25s node "$ENTRY" > ../node-run.log 2>&1 ); RC=$?
                tail -n 60 ../node-run.log | tee -a agent.log
                if [ "$RC" = "124" ]; then echo "entry still running after 25s (long-lived server?) - partial output above, AI verdict stands" | tee -a agent.log
                elif [ "$RC" != "0" ]; then mark_fail "node-run"; else echo "node-run-exit=0" | tee -a agent.log; fi
              else
                echo "no entry file - deps install only, AI verdict stands" | tee -a agent.log
              fi
            fi
          fi
          # ---- Java Maven (pom.xml) ----
          if [ -f $W/pom.xml ]; then
            BUILD_RAN=1
            echo "=== REAL MAVEN BUILD (dir=$W) ===" | tee -a agent.log
            mvn -f $W/pom.xml -q -DskipTests package 2>&1 | tee mvn-build.log | tail -n 40 | tee -a agent.log
            if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "maven-build"; else echo "maven-build-exit=0" | tee -a agent.log; fi
          fi
          # ---- Java Gradle (non-Android: build.gradle, kintu Android marker nei) ----
          if [ -f $W/build.gradle ] || [ -f $W/build.gradle.kts ]; then
            if [ ! -f $W/settings.gradle ] && [ ! -f $W/app/build.gradle ] && ! find $W -name AndroidManifest.xml -print -quit 2>/dev/null | grep -q .; then
              BUILD_RAN=1
              echo "=== REAL GRADLE BUILD (build, dir=$W) ===" | tee -a agent.log
              if [ -f $W/gradlew ]; then chmod +x $W/gradlew; GRADLE_CMD="$W/gradlew -p $W"; elif [ -f ./gradlew ]; then chmod +x ./gradlew; GRADLE_CMD="./gradlew -p $W"; else curl -fsSL https://services.gradle.org/distributions/gradle-8.7-bin.zip -o /tmp/gradle.zip && unzip -q /tmp/gradle.zip -d /tmp && export PATH=/tmp/gradle-8.7/bin:$PATH; GRADLE_CMD="gradle -p $W"; fi
              $GRADLE_CMD build -x test --stacktrace 2>&1 | tee gradle-build.log | tail -n 60 | tee -a agent.log
              if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "gradle-build"; else echo "gradle-build-exit=0" | tee -a agent.log; fi
            fi
          fi
          # ---- C/C++ (Makefile / CMake / single file) ----
          if [ -f $W/Makefile ] || [ -f $W/makefile ] || [ -f $W/GNUmakefile ] || [ -f $W/CMakeLists.txt ] || find $W -maxdepth 3 \( -name "*.c" -o -name "*.cpp" -o -name "*.cc" \) 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== REAL C/C++ BUILD (dir=$W) ===" | tee -a agent.log
            sudo apt-get update -qq 2>&1 | tail -n 1 | tee -a agent.log
            sudo apt-get install -y -qq mingw-w64 2>&1 | tail -n 2 | tee -a agent.log
            if [ -f $W/CMakeLists.txt ]; then
              cmake -S $W -B cppbuild -DCMAKE_BUILD_TYPE=Release > cmake-config.log 2>&1; RC=$?
              tail -n 10 cmake-config.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "cmake-config"; else cmake --build cppbuild --config Release > cpp-build.log 2>&1; RC=$?; tail -n 30 cpp-build.log | tee -a agent.log; if [ "$RC" != "0" ]; then mark_fail "cmake-build"; else echo "cmake-build-exit=0" | tee -a agent.log; fi; fi
            elif [ -f $W/Makefile ] || [ -f $W/makefile ] || [ -f $W/GNUmakefile ]; then
              make -C $W > cpp-build.log 2>&1; RC=$?
              tail -n 30 cpp-build.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "make-build"; else echo "make-build-exit=0" | tee -a agent.log; fi
            else
              SRC=$(find $W -maxdepth 2 \( -name "*.cpp" -o -name "*.cc" -o -name "*.c" \) 2>/dev/null | head -n 2)
              COUNT=$(echo "$SRC" | grep -c .)
              if [ "$COUNT" = "1" ]; then
                case "$SRC" in *.cpp|*.cc) CC=g++; MCC=x86_64-w64-mingw32-g++;; *) CC=gcc; MCC=x86_64-w64-mingw32-gcc;; esac
                $CC -O2 "$SRC" -o ./appbin > cpp-build.log 2>&1; RC=$?
                tail -n 30 cpp-build.log | tee -a agent.log
                if [ "$RC" != "0" ]; then mark_fail "cpp-compile"; else echo "cpp-compile-exit=0 ($SRC)" | tee -a agent.log; NATIVE_BIN=./appbin; fi
                $MCC -O2 "$SRC" -o ./app.exe > cpp-exe.log 2>&1; RC=$?
                tail -n 20 cpp-exe.log | tee -a agent.log
                if [ "$RC" != "0" ]; then mark_fail "mingw-exe"; else echo "exe-ready=app.exe" | tee -a agent.log; fi
              else
                echo "multi-file C++ without Makefile/CMake - AI verdict stands (native check skip)" | tee -a agent.log
              fi
            fi
          fi
          # ---- Flutter (pubspec.yaml) ----
          if [ -f $W/pubspec.yaml ]; then
            BUILD_RAN=1
            echo "=== REAL FLUTTER ANALYZE (dir=$W) ===" | tee -a agent.log
            if [ ! -x "$HOME/flutter/bin/flutter" ]; then git clone --depth 1 -b stable https://github.com/flutter/flutter.git "$HOME/flutter" > flutter-install.log 2>&1; RC=$?; tail -n 5 flutter-install.log | tee -a agent.log; if [ "$RC" != "0" ]; then mark_fail "flutter-install"; fi; fi
            export PATH="$HOME/flutter/bin:$PATH"
            (cd $W && flutter pub get > ../flutter-pub.log 2>&1 && flutter analyze > ../flutter-analyze.log 2>&1); RC=$?
            tail -n 10 flutter-pub.log | tee -a agent.log
            tail -n 30 flutter-analyze.log | tee -a agent.log
            if [ "$RC" != "0" ]; then mark_fail "flutter-analyze"; else echo "flutter-analyze-exit=0" | tee -a agent.log; fi
          fi
          # ---- Deno (deno.json / deno.lock) ----
          if [ -f $W/deno.json ] || [ -f $W/deno.jsonc ] || [ -f $W/deno.lock ]; then
            BUILD_RAN=1
            echo "=== REAL DENO CHECK+COMPILE (dir=$W) ===" | tee -a agent.log
            if [ ! -x "$HOME/.deno/bin/deno" ]; then curl -fsSL https://deno.land/install.sh | sh > deno-install.log 2>&1; RC=$?; tail -n 3 deno-install.log | tee -a agent.log; if [ "$RC" != "0" ]; then mark_fail "deno-install"; fi; fi
            export PATH="$HOME/.deno/bin:$PATH"
            DENTRY=""
            for c in main.ts mod.ts index.ts server.ts app.ts; do if [ -f "$W/$c" ]; then DENTRY="$c"; break; fi; done
            if [ -z "$DENTRY" ]; then DENTRY=$(find $W -maxdepth 2 -name "*.ts" -not -name "*.d.ts" 2>/dev/null | head -n 1 | sed "s|^$W/||"); fi
            if [ -n "$DENTRY" ]; then
              echo "deno-entry=$DENTRY" | tee -a agent.log
              (cd $W && deno check "$DENTRY" > ../deno-check.log 2>&1); RC=$?
              tail -n 30 deno-check.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "deno-check"; else echo "deno-check-exit=0" | tee -a agent.log; fi
              (cd $W && deno compile --allow-all --output ../appbin "$DENTRY" > ../deno-bin.log 2>&1); RC=$?
              tail -n 10 deno-bin.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "deno-compile"; else echo "bin-ready=appbin" | tee -a agent.log; NATIVE_BIN=./appbin; fi
              (cd $W && deno compile --target x86_64-pc-windows-msvc --allow-all --output ../app.exe "$DENTRY" > ../deno-exe.log 2>&1); RC=$?
              tail -n 10 deno-exe.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "deno-exe"; else echo "exe-ready=app.exe" | tee -a agent.log; fi
            else
              echo "no deno entry .ts found - AI verdict stands" | tee -a agent.log
            fi
          fi
          # ---- Bun (bun.lockb / bunfig.toml) ----
          if [ -f $W/bun.lockb ] || [ -f $W/bunfig.toml ]; then
            BUILD_RAN=1
            echo "=== REAL BUN BUILD (dir=$W) ===" | tee -a agent.log
            if [ ! -x "$HOME/.bun/bin/bun" ]; then curl -fsSL https://bun.sh/install | bash > bun-setup.log 2>&1; RC=$?; tail -n 3 bun-setup.log | tee -a agent.log; if [ "$RC" != "0" ]; then mark_fail "bun-setup"; fi; fi
            export PATH="$HOME/.bun/bin:$PATH"
            if [ -f $W/package.json ]; then (cd $W && bun install > ../bun-install.log 2>&1); RC=$?; tail -n 10 bun-install.log | tee -a agent.log; if [ "$RC" != "0" ]; then mark_fail "bun-install"; fi; fi
            if [ -f $W/package.json ] && node -e "process.exit(require('./$W/package.json').scripts && require('./$W/package.json').scripts.build ? 0 : 1)"; then
              (cd $W && bun run build > ../bun-build.log 2>&1); RC=$?
              tail -n 40 bun-build.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "bun-build"; else echo "bun-build-exit=0" | tee -a agent.log; fi
            else
              BENTRY=""
              if [ -f $W/package.json ]; then BENTRY=$(node -e "try{console.log(require('./$W/package.json').main||'')}catch(e){console.log('')}"); fi
              if [ -z "$BENTRY" ]; then for c in index.ts server.ts app.ts main.ts index.js server.js app.js; do if [ -f "$W/$c" ]; then BENTRY="$c"; break; fi; done; fi
              if [ -n "$BENTRY" ] && [ -f "$W/$BENTRY" ]; then
                echo "run: bun $BENTRY (dir=$W)" | tee -a agent.log
                ( cd $W && timeout 25s bun run "$BENTRY" > ../bun-run.log 2>&1 ); RC=$?
                tail -n 60 ../bun-run.log | tee -a agent.log
                if [ "$RC" = "124" ]; then echo "entry still running after 25s - partial output above, AI verdict stands" | tee -a agent.log
                elif [ "$RC" != "0" ]; then mark_fail "bun-run"; else echo "bun-run-exit=0" | tee -a agent.log; fi
              else
                echo "no bun entry file - AI verdict stands" | tee -a agent.log
              fi
            fi
          fi
          # ---- .NET (csproj / sln) ----
          DOTNET_PROJ=$(find $W -maxdepth 3 \( -name "*.sln" -o -name "*.csproj" \) 2>/dev/null | head -n 1)
          if [ -n "$DOTNET_PROJ" ] || find $W -maxdepth 3 -name "*.cs" 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== REAL DOTNET BUILD (dir=$W) ===" | tee -a agent.log
            if [ -z "$DOTNET_PROJ" ]; then
              echo "no csproj/sln (loose .cs only) - AI verdict stands" | tee -a agent.log
            else
              dotnet build "$DOTNET_PROJ" -v minimal > dotnet-build.log 2>&1; RC=$?
              tail -n 30 dotnet-build.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "dotnet-build"; else echo "dotnet-build-exit=0" | tee -a agent.log; fi
              dotnet publish "$DOTNET_PROJ" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o winpub > dotnet-exe.log 2>&1; RC=$?
              tail -n 10 dotnet-exe.log | tee -a agent.log
              WEXE=$(find winpub -name "*.exe" 2>/dev/null | head -n 1)
              if [ "$RC" = "0" ] && [ -n "$WEXE" ]; then cp "$WEXE" ./app.exe; echo "exe-ready=app.exe" | tee -a agent.log
              else echo "win-x64 publish skip/fail (bonus artifact) - build verdict stands" | tee -a agent.log; fi
            fi
          fi
          # ---- Java plain (javac, build file nei) ----
          if [ ! -f $W/pom.xml ] && [ ! -f $W/build.gradle ] && [ ! -f $W/build.gradle.kts ]; then
            JFILES=$(find $W -name "*.java" 2>/dev/null)
            if [ -n "$JFILES" ]; then
              BUILD_RAN=1
              echo "=== REAL JAVAC BUILD (dir=$W) ===" | tee -a agent.log
              rm -rf javaclasses && mkdir -p javaclasses
              javac -d javaclasses $JFILES > javac-build.log 2>&1; RC=$?
              tail -n 30 javac-build.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "javac-build"; else echo "javac-build-exit=0" | tee -a agent.log
                (cd javaclasses && jar cf ../app.jar . > ../jar-build.log 2>&1); RC=$?
                if [ "$RC" = "0" ]; then cp ./app.jar ./plugin.jar; echo "app.jar" > jar-name.txt; echo "jar-ready=app.jar" | tee -a agent.log; fi
              fi
            fi
          fi
          # ---- PHP (php -l syntax) ----
          PHPFILES=$(find $W -name "*.php" -not -path "$W/vendor/*" 2>/dev/null)
          if [ -n "$PHPFILES" ]; then
            BUILD_RAN=1
            echo "=== REAL PHP LINT (dir=$W) ===" | tee -a agent.log
            FAIL=0
            for F in $PHPFILES; do php -l "$F" >> php-lint.log 2>&1 || FAIL=1; done
            tail -n 20 php-lint.log | tee -a agent.log
            if [ "$FAIL" != "0" ]; then mark_fail "php-lint"; else echo "php-lint-exit=0" | tee -a agent.log; fi
          fi
          # ---- Ruby (ruby -c syntax) ----
          RBFILES=$(find $W -name "*.rb" 2>/dev/null)
          if [ -n "$RBFILES" ]; then
            BUILD_RAN=1
            echo "=== REAL RUBY CHECK (dir=$W) ===" | tee -a agent.log
            FAIL=0
            for F in $RBFILES; do ruby -c "$F" >> ruby-check.log 2>&1 || FAIL=1; done
            tail -n 20 ruby-check.log | tee -a agent.log
            if [ "$FAIL" != "0" ]; then mark_fail "ruby-check"; else echo "ruby-check-exit=0" | tee -a agent.log; fi
          fi
          # ---- Web static (JS syntax / TS check, package manager nei) ----
          if [ ! -f $W/package.json ] && [ ! -f $W/deno.json ] && [ ! -f $W/deno.jsonc ] && [ ! -f $W/bun.lockb ] && [ ! -f $W/bunfig.toml ]; then
            JSFILES=$(find $W -maxdepth 4 \( -name "*.js" -o -name "*.mjs" -o -name "*.cjs" \) -not -path "*/node_modules/*" 2>/dev/null)
            TSXFILES=$(find $W -maxdepth 4 \( -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -name "*.d.ts" 2>/dev/null)
            if [ -n "$JSFILES" ] || [ -n "$TSXFILES" ]; then
              BUILD_RAN=1
              echo "=== REAL WEB CHECK (dir=$W) ===" | tee -a agent.log
              FAIL=0
              for F in $JSFILES; do node --check "$F" >> web-check.log 2>&1 || FAIL=1; done
              if [ -n "$TSXFILES" ]; then npx -y -p typescript tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop --module esnext --moduleResolution bundler --target es2020 $TSXFILES >> web-check.log 2>&1 || FAIL=1; fi
              tail -n 20 web-check.log | tee -a agent.log
              if [ "$FAIL" != "0" ]; then mark_fail "web-check"; else echo "web-check-exit=0" | tee -a agent.log; fi
            else
              echo "html/css only - static verifier nei, AI verdict stands" | tee -a agent.log
            fi
          fi
          # ---- Minecraft datapack (JSON validate) ----
          if [ -f $W/pack.mcmeta ] || find $W -name "*.mcfunction" 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== REAL DATAPACK JSON CHECK (dir=$W) ===" | tee -a agent.log
            python3 -c "import json,sys,glob; bad=0
            for f in glob.glob('$W/**/*.json', recursive=True):
                try: json.load(open(f, encoding='utf-8'))
                except Exception as e: print('BAD-JSON:', f, e); bad=1
            sys.exit(bad)" > datapack-check.log 2>&1; RC=$?
            tail -n 20 datapack-check.log | tee -a agent.log
            if [ "$RC" != "0" ]; then mark_fail "datapack-json"; else echo "datapack-json-exit=0" | tee -a agent.log; fi
          fi
          # ---- Minecraft plugin detect + jar locate ----
          if [ -f $W/plugin.yml ] || [ -f $W/paper-plugin.yml ] || [ -f $W/bukkit.yml ] || [ -f $W/spigot.yml ] || [ -f $W/fabric.mod.json ] || [ -f $W/quilt.mod.json ] || ls $W/*.mcpack $W/*.mcaddon >/dev/null 2>&1 || find $W -name mods.toml -print -quit 2>/dev/null | grep -q .; then
            BUILD_RAN=1
            echo "=== MINECRAFT PLUGIN DETECTED ===" | tee -a agent.log
          fi
          JAR=$(find $W -name "*.jar" -not -path "*/node_modules/*" 2>/dev/null | grep -v -e "-sources" -e "-javadoc" -e "gradle-wrapper" | head -n 1)
          if [ -n "$JAR" ]; then
            echo "jar-files: $JAR ($(du -h "$JAR" | cut -f1))" | tee -a agent.log
            cp "$JAR" ./plugin.jar
            basename "$JAR" > jar-name.txt
            echo "jar-ready=$(cat jar-name.txt)" | tee -a agent.log
          else
            echo "no jar built (Java build fail hole jar thakbe na)" | tee -a agent.log
          fi
          # ---- Linux .deb package (native binary thakle) ----
          if [ -n "$NATIVE_BIN" ] && [ -f "$NATIVE_BIN" ]; then
            PKGNAME=$(basename "$NATIVE_BIN" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9+.-')
            if [ -z "$PKGNAME" ]; then PKGNAME=app; fi
            rm -rf debpkg && mkdir -p debpkg/DEBIAN debpkg/usr/local/bin
            cp "$NATIVE_BIN" "debpkg/usr/local/bin/$PKGNAME"
            printf "Package: %s\nVersion: 1.0.0\nArchitecture: amd64\nMaintainer: codebridge <noreply@local>\nDescription: Auto-built by CodeBridge\n" "$PKGNAME" > debpkg/DEBIAN/control
            dpkg-deb --build debpkg "./$PKGNAME.deb" > deb-build.log 2>&1; RC=$?
            tail -n 5 deb-build.log | tee -a agent.log
            if [ "$RC" != "0" ]; then mark_fail "deb-build"; else echo "deb-ready=$PKGNAME.deb" | tee -a agent.log; fi
          else
            echo "no native binary - deb skip" | tee -a agent.log
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
            PKG=$(cd $W && go list -e -f '{{if eq .Name "main"}}{{.ImportPath}} {{end}}' ./... 2>/dev/null | awk '{print $1}')
            if [ -n "$PKG" ]; then
              echo "go-main-pkg=$PKG" | tee -a agent.log
              (cd $W && GOOS=windows GOARCH=amd64 go build -o ../app.exe "$PKG" > ../go-exe.log 2>&1); RC=$?
              tail -n 20 go-exe.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "go-exe"; else echo "exe-ready=app.exe" | tee -a agent.log; fi
              (cd $W && go build -o ../appbin "$PKG" > ../go-bin.log 2>&1); RC=$?
              tail -n 20 go-bin.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "go-bin"; else echo "bin-ready=appbin" | tee -a agent.log; NATIVE_BIN=./appbin; fi
            else
              echo "no main package (library?) - exe/deb skip" | tee -a agent.log
            fi
          fi
          # ---- Rust (Cargo.toml) ----
          if [ -f $W/Cargo.toml ]; then
            BUILD_RAN=1
            echo "=== REAL RUST BUILD (dir=$W) ===" | tee -a agent.log
            (cd $W && cargo build) 2>&1 | tee ../rust-build.log | tail -n 30 | tee -a agent.log
            if [ "\${PIPESTATUS[0]}" != "0" ]; then mark_fail "cargo-build"; else echo "cargo-build-exit=0" | tee -a agent.log; fi
            RNAME=$(grep -m1 '^name' $W/Cargo.toml | cut -d'"' -f2)
            if [ -n "$RNAME" ] && [ -f "$W/target/debug/$RNAME" ]; then
              NATIVE_BIN=$W/target/debug/$RNAME
              echo "bin-ready=$NATIVE_BIN" | tee -a agent.log
              sudo apt-get update -qq 2>&1 | tail -n 1 | tee -a agent.log
              sudo apt-get install -y -qq mingw-w64 2>&1 | tail -n 2 | tee -a agent.log
              mkdir -p $W/.cargo
              printf '[target.x86_64-pc-windows-gnu]\nlinker = "x86_64-w64-mingw32-gcc"\n' > $W/.cargo/config.toml
              (cd $W && rustup target add x86_64-pc-windows-gnu > ../rust-target.log 2>&1 && cargo build --target x86_64-pc-windows-gnu > ../rust-exe.log 2>&1); RC=$?
              tail -n 20 rust-exe.log | tee -a agent.log
              if [ "$RC" != "0" ]; then mark_fail "rust-exe"; else cp "$W/target/x86_64-pc-windows-gnu/debug/$RNAME.exe" ./app.exe; echo "exe-ready=app.exe" | tee -a agent.log; fi
            else
              echo "lib crate or no binary (name=$RNAME) - exe skip" | tee -a agent.log
            fi
          fi
          if [ "$BUILD_RAN" = "0" ]; then
            echo "skip: kono known project type na — AI verdict stands" | tee -a agent.log
          fi
      - name: Send APK/JAR to web (thakle — web theke agent download korbe)
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
          if [ -f ./plugin.jar ]; then
            JARNAME=$(cat jar-name.txt 2>/dev/null || echo "plugin.jar")
            echo "uploading jar $JARNAME ($(du -h ./plugin.jar | cut -f1))"
            WEB="\${WEB_URL%/}"
            curl -sf -X POST -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" --data-binary "@./plugin.jar" "$WEB/api/runner/apk?task_id=\${{ inputs.task_id }}&kind=jar&name=$JARNAME"
            echo "jar-sent=$?"
          else
            echo "no jar (non-Java ba build fail)"
          fi
          EXE=$(ls ./*.exe 2>/dev/null | head -n 1)
          if [ -n "$EXE" ]; then
            EXENAME=$(basename "$EXE")
            echo "uploading exe $EXENAME ($(du -h "$EXE" | cut -f1))"
            WEB="\${WEB_URL%/}"
            curl -sf -X POST -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" --data-binary "@$EXE" "$WEB/api/runner/apk?task_id=\${{ inputs.task_id }}&kind=exe&name=$EXENAME"
            echo "exe-sent=$?"
          else
            echo "no exe"
          fi
          DEB=$(ls ./*.deb 2>/dev/null | head -n 1)
          if [ -n "$DEB" ]; then
            DEBNAME=$(basename "$DEB")
            echo "uploading deb $DEBNAME ($(du -h "$DEB" | cut -f1))"
            WEB="\${WEB_URL%/}"
            curl -sf -X POST -H "Authorization: Bearer \${{ secrets.RUNNER_TOKEN }}" --data-binary "@$DEB" "$WEB/api/runner/apk?task_id=\${{ inputs.task_id }}&kind=deb&name=$DEBNAME"
            echo "deb-sent=$?"
          else
            echo "no deb"
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
            mvn-build.log
            node-build.log
            node-run.log
            go-exe.log
            go-bin.log
            rust-exe.log
            cpp-build.log
            cpp-exe.log
            deb-build.log
            flutter-analyze.log
            deno-check.log
            deno-bin.log
            deno-exe.log
            bun-build.log
            bun-run.log
            dotnet-build.log
            javac-build.log
            php-lint.log
            ruby-check.log
            web-check.log
            datapack-check.log
          if-no-files-found: warn
      - name: Upload APK (agar build success hoy)
        if: always()
        run: |
          ls -lh task-work/app/build/outputs/apk/debug/ 2>/dev/null || echo "no apk dir (gradle fail hole APK thakbe na)"
          ls -lh plugin.jar 2>/dev/null || echo "no plugin.jar (non-Java ba build fail)"
          ls -lh ./*.exe ./*.deb 2>/dev/null || echo "no exe/deb"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-\${{ inputs.task_id }}-apk
          path: |
            app/build/outputs/apk/debug/*.apk
            plugin.jar
            *.exe
            *.deb
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
