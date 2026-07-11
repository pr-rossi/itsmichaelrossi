/**
 * liquid.js — Progressive enhancement for the hero name.
 *
 * Renders "michael rossi?" to a texture and, on a WebGL canvas laid over the real
 * text, warps the letters near the cursor with a chromatic-aberration ripple —
 * like the type is melting through wet glass. The real <h1> text stays in the DOM
 * (a11y / SEO / no-JS); this only runs on fine pointers with motion allowed and
 * WebGL available. If anything is missing, the plain text is left untouched.
 */
(function () {
    'use strict';

    var name = document.querySelector('.hero-intro__name');
    var you = name && name.querySelector('.hero-intro__you');
    if (!you) return;

    // Respect reduced motion and skip coarse/touch pointers.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!(window.matchMedia && window.matchMedia('(pointer: fine)').matches)) return;

    var VERT = [
        'attribute vec2 aPos;',
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = aPos * 0.5 + 0.5;',
        '  gl_Position = vec4(aPos, 0.0, 1.0);',
        '}'
    ].join('\n');

    var FRAG = [
        'precision highp float;',
        'uniform sampler2D uTex;',
        'uniform vec2 uMouse;',   // UV space, y up
        'uniform float uActive;', // 0..1 hover strength
        'uniform float uTime;',
        'uniform float uAspect;', // width / height of the canvas
        'varying vec2 vUv;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
        'float vnoise(vec2 p){',
        '  vec2 i = floor(p), f = fract(p);',
        '  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
        '}',
        'void main(){',
        '  vec2 uv = vUv;',
        '  vec2 d = uv - uMouse;',
        '  vec2 da = vec2(d.x * uAspect, d.y);',
        '  float dist = length(da);',
        '  float fall = smoothstep(0.30, 0.0, dist);', // 1 at cursor -> 0 at edge
        '  float amp = fall * uActive;',
        '  float t = uTime;',
        '  vec2 flow = vec2(',
        '    vnoise(uv * 5.0 + vec2(t * 0.6, t * 0.2)),',
        '    vnoise(uv * 5.0 + vec2(-t * 0.3, t * 0.5))',
        '  ) - 0.5;',
        '  vec2 dir = da / (dist + 1e-4);',
        '  float ripple = sin(dist * 32.0 - t * 3.4);',
        '  vec2 disp = (flow * 2.6 + dir * ripple * 0.8) * 0.055 * amp;',
        '  vec2 caDir = normalize(flow + dir * 0.6 + 1e-4);',
        '  float ca = 0.022 * amp;',
        '  vec2 base = uv + disp;',
        '  float r = texture2D(uTex, base + caDir * ca).a;',
        '  float g = texture2D(uTex, base).a;',
        '  float b = texture2D(uTex, base - caDir * ca).a;',
        '  vec3 col = vec3(r, g, b);',
        '  float alpha = max(r, max(g, b));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var canvas, gl, prog, uni, texCanvas, tex;
    var W = 0, H = 0, padX = 0, padY = 0;
    var mouse = [0.5, 0.5], target = [0.5, 0.5];
    var active = 0, activeTarget = 0;
    var time = 0, raf = null, lastT = 0, started = false, built = false;

    function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
        return s;
    }

    // Draw the word into a 2D canvas we can upload as a texture.
    function drawText() {
        var cs = getComputedStyle(you);
        var fontSize = parseFloat(cs.fontSize);
        var font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fontSize + 'px ' + cs.fontFamily;
        var text = (you.textContent || '').trim().toLowerCase();
        var color = cs.color || '#fff';

        // padding so warped pixels near the edge aren't clipped
        padX = Math.round(fontSize * 0.28);
        padY = Math.round(fontSize * 0.28);
        var rect = you.getBoundingClientRect();
        W = Math.ceil(rect.width) + padX * 2;
        H = Math.ceil(rect.height) + padY * 2;

        if (!texCanvas) texCanvas = document.createElement('canvas');
        texCanvas.width = Math.round(W * DPR);
        texCanvas.height = Math.round(H * DPR);
        var c = texCanvas.getContext('2d');
        c.setTransform(DPR, 0, 0, DPR, 0, 0);
        c.clearRect(0, 0, W, H);
        c.font = font;
        c.fillStyle = color;
        c.textBaseline = 'alphabetic';
        c.textAlign = 'left';
        try { c.letterSpacing = cs.letterSpacing; } catch (e) {}

        var m = c.measureText(text);
        var asc = m.actualBoundingBoxAscent || fontSize * 0.72;
        var desc = m.actualBoundingBoxDescent || fontSize * 0.1;
        var glyphH = asc + desc;
        var x = (W - m.width) / 2;
        var y = padY + asc + ((H - padY * 2) - glyphH) / 2;
        c.fillText(text, x, y);
    }

    function build() {
        gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: true })
          || canvas.getContext('experimental-webgl', { premultipliedAlpha: false, alpha: true, antialias: true });
        if (!gl) return false;

        var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return false;
        prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        uni = {
            uTex: gl.getUniformLocation(prog, 'uTex'),
            uMouse: gl.getUniformLocation(prog, 'uMouse'),
            uActive: gl.getUniformLocation(prog, 'uActive'),
            uTime: gl.getUniformLocation(prog, 'uTime'),
            uAspect: gl.getUniformLocation(prog, 'uAspect')
        };

        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        return true;
    }

    function upload() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
    }

    function layout() {
        var nameRect = name.getBoundingClientRect();
        var rect = you.getBoundingClientRect();
        canvas.style.left = (rect.left - nameRect.left - padX) + 'px';
        canvas.style.top = (rect.top - nameRect.top - padY) + 'px';
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1i(uni.uTex, 0);
        gl.uniform2f(uni.uMouse, mouse[0], mouse[1]);
        gl.uniform1f(uni.uActive, active);
        gl.uniform1f(uni.uTime, time);
        gl.uniform1f(uni.uAspect, W / H);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now) {
        raf = null;
        var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
        lastT = now;
        time += dt;
        // ease mouse + active
        var k = 1 - Math.pow(0.0015, dt); // smoothing
        mouse[0] += (target[0] - mouse[0]) * k;
        mouse[1] += (target[1] - mouse[1]) * k;
        active += (activeTarget - active) * (1 - Math.pow(0.02, dt));
        render();
        // keep going while there's motion to resolve
        if (activeTarget > 0.001 || active > 0.003) {
            raf = requestAnimationFrame(frame);
        } else {
            active = 0; render(); lastT = 0; raf = null; // settle on the plain word
        }
    }

    function loop() { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } }

    function toUV(e) {
        var r = canvas.getBoundingClientRect();
        target[0] = (e.clientX - r.left) / r.width;
        target[1] = 1 - (e.clientY - r.top) / r.height; // flip Y (texture flipped)
    }

    function ensureBuilt() {
        if (built) return true;
        // Only when the name is a single line — the texture is drawn as one line.
        var fs = parseFloat(getComputedStyle(you).fontSize);
        if (you.getBoundingClientRect().height > fs * 1.5) return false;
        canvas = document.createElement('canvas');
        canvas.className = 'hero-liquid';
        canvas.setAttribute('aria-hidden', 'true');
        if (!build()) { canvas = null; return false; }
        drawText();
        layout();
        upload();
        render();          // resting word, so the crossfade has something to show
        name.appendChild(canvas);
        built = true;
        return true;
    }

    function activate() {
        if (!ensureBuilt()) return;
        if (!started) {
            started = true;
            name.classList.add('is-liquid');
            canvas.classList.add('is-ready');
        }
        activeTarget = 1;
        loop();
    }

    // Build lazily once fonts are ready, so the entrance animation plays on real text.
    var readyToBuild = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
        readyToBuild = true;
    });

    you.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch' || !readyToBuild) return;
        if (!ensureBuilt()) return;
        toUV(e); mouse[0] = target[0]; mouse[1] = target[1];
        activate();
    });
    you.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' || !built) return;
        toUV(e);
        activeTarget = 1; loop();
    }, { passive: true });
    you.addEventListener('pointerleave', function () { activeTarget = 0; loop(); });

    // Rebuild on resize (debounced) so the texture stays crisp and aligned.
    var rt = null;
    window.addEventListener('resize', function () {
        if (!built) return;
        clearTimeout(rt);
        rt = setTimeout(function () {
            drawText(); layout(); upload(); render();
        }, 200);
    });
})();
