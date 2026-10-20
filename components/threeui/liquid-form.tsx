'use client';
/** Adapted from ThreeUI Community LiquidFormBackground, MIT © 2026 Meng To.
 * Source: https://github.com/MengTo/threeui/tree/main/src/shaders/liquid-form
 * Local lifecycle, bounded resolution, arctic lighting, and reduced-motion policy.
 */
import { useEffect, useRef, useState } from 'react';
import { VELOX_VERTEX_SHADER, VELOX_FRAGMENT_SHADER } from './liquid-form-shaders';
export function LiquidForm() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let intersecting = false;
    const update = () => setActive(intersecting && !document.hidden && !motion.matches);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    observer.observe(node);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return (
    <div
      ref={host}
      className="liquid-form"
      aria-hidden="true"
      data-threeui="Liquid Form / Community"
    >
      {active && <LiquidCanvas />}
    </div>
  );
}
function LiquidCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const gl = node.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    let frame = 0;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    try {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw Error('Shader unavailable');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Shader unsupported');
        return shader;
      };
      program = gl.createProgram();
      if (!program) throw Error('Program unavailable');
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VELOX_VERTEX_SHADER));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, VELOX_FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Program unsupported');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const pos = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      const uniform = (name: string) => gl.getUniformLocation(program!, name);
      const resolution = uniform('u_res'),
        time = uniform('u_time');
      gl.uniform2f(uniform('u_mouse'), 0.15, -0.2);
      for (const [name, value] of Object.entries({
        u_morph: 1.3,
        u_noise_scale: 1,
        u_mouse_amount: 0.1,
        u_metal: 1.2,
        u_camera: 5.5,
      }))
        gl.uniform1f(uniform(name), value);
      node.width = node.height = innerWidth < 700 ? 240 : 360;
      gl.viewport(0, 0, node.width, node.height);
      gl.uniform2f(resolution, node.width, node.height);
      let last = 0;
      const render = (now: number) => {
        if (now - last > 40) {
          gl.uniform1f(time, now * 0.0002);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          last = now;
        }
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
    } catch {
      node.style.display = 'none';
    }
    return () => {
      cancelAnimationFrame(frame);
      if (buffer) gl.deleteBuffer(buffer);
      shaders.forEach((s) => gl.deleteShader(s));
      if (program) gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);
  return <canvas ref={canvas} />;
}
