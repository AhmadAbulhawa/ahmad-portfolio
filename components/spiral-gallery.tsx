'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { galleryProjects } from '@/lib/gallery-projects';

export default function SpiralGallery({
  selected,
  onSettled,
}: {
  selected: number;
  onSettled: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const initialSelection = useRef(selected);
  const controls = useRef<{ target: (value: number) => void } | null>(null);
  const settled = useRef(onSettled);
  useEffect(() => {
    settled.current = onSettled;
  }, [onSettled]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = innerWidth < 700;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 1, 6000);
    const renderer = new CSS3DRenderer();
    renderer.domElement.className = 'spiral-dom';
    container.append(renderer.domElement);
    const cards = galleryProjects.map((p, i) => {
      const a = document.createElement('a');
      a.className = `glass-project${p.portrait ? ' is-portrait' : ''}`;
      a.href = `/projects/${p.slug}/`;
      a.dataset.project = p.slug;
      const media = document.createElement('div');
      media.className = 'glass-project-art';
      const img = document.createElement('img');
      img.src = p.image;
      img.alt = `${p.name} — original project artwork`;
      img.draggable = false;
      media.append(img);
      const meta = document.createElement('div');
      meta.className = 'glass-project-meta';
      const text = document.createElement('div');
      const small = document.createElement('span');
      small.textContent = `0${i + 1} / ${p.category}`;
      const title = document.createElement('h3');
      title.textContent = p.name;
      const arrow = document.createElement('span');
      arrow.className = 'glass-project-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      text.append(small, title);
      meta.append(text, arrow);
      a.append(media, meta);
      const object = new CSS3DObject(a);
      scene.add(object);
      return object;
    });
    let width = 1,
      height = 1,
      position = initialSelection.current,
      source = position,
      target = position,
      started = 0,
      moving = false,
      frame = 0,
      visible = true;
    let webgl: THREE.WebGLRenderer | undefined;
    const atmosphere = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();
    const triangle = new THREE.BufferGeometry();
    triangle.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-15, -24, 0, 27, -8, 0, -3, 32, 0], 3),
    );
    triangle.computeVertexNormals();
    const materials = ['#82d8ed', '#9d91f7', '#ed85bc'].map(
      (color) =>
        new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.65,
          roughness: 0.15,
          iridescence: 1,
          iridescenceIOR: 1.5,
          transparent: true,
          opacity: 0.44,
          side: THREE.DoubleSide,
        }),
    );
    const shards = Array.from({ length: mobile ? 9 : 22 }, (_, i) => {
      const m = new THREE.Mesh(triangle, materials[i % 3]);
      m.position.set(Math.sin(i * 7.2) * 1100, Math.cos(i * 3.1) * 600, -300 - i * 30);
      m.rotation.set(i, i * 0.3, i);
      atmosphere.add(m);
      return m;
    });
    const particles = new Float32Array((mobile ? 48 : 150) * 3);
    for (let i = 0; i < particles.length; i++)
      particles[i] = Math.sin(i * 31.7) * (i % 3 === 2 ? 900 : 1600);
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: '#a8c5e4',
      size: 2,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(geometry, dustMaterial);
    dust.position.z = -500;
    atmosphere.add(dust);
    atmosphere.add(new THREE.AmbientLight('#b3caff', 2));
    const cyan = new THREE.DirectionalLight('#6edbff', 4);
    cyan.position.set(-1, 1, 2);
    atmosphere.add(cyan);
    const violet = new THREE.DirectionalLight('#ac6cff', 3);
    violet.position.set(1, -1, 2);
    atmosphere.add(violet);
    try {
      webgl = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: 'low-power',
      });
      webgl.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.5));
      webgl.domElement.className = 'spiral-atmosphere';
      container.prepend(webgl.domElement);
    } catch {
      container.dataset.webgl = 'unavailable';
    }
    function draw() {
      cards.forEach((card, i) => {
        const relative = i - position;
        const angle = relative * 1.4;
        card.position.set(
          Math.sin(angle) * width * (mobile ? 0.6 : 0.57),
          relative * height * (mobile ? 0.16 : 0.17),
          (Math.cos(angle) - 1) * width * 0.4 - Math.abs(relative) * 110,
        );
        card.rotation.y = -Math.sin(angle) * 0.7;
        card.element.style.opacity = String(Math.max(0.18, 1 - Math.abs(relative) * 0.23));
        card.element.style.pointerEvents = Math.abs(relative) < 0.05 ? 'auto' : 'none';
        card.element.tabIndex = Math.abs(relative) < 0.05 ? 0 : -1;
        card.element.dataset.relative = relative.toFixed(4);
        card.element.dataset.facing = card.rotation.y.toFixed(4);
      });
      renderer.render(scene, camera);
    }
    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      camera.aspect = width / height;
      camera.position.z = height / (2 * Math.tan(THREE.MathUtils.degToRad(25)));
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      webgl?.setSize(width, height);
      cards.forEach((card) => {
        card.element.style.width = `${Math.min(width * (mobile ? 0.88 : 0.59), height * (mobile ? 1.32 : 1.5))}px`;
      });
      draw();
      webgl?.render(atmosphere, camera);
    }
    let lastDraw = 0;
    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      if (moving) {
        const t = Math.min(1, (now - started) / (mobile ? 360 : 420));
        const ease = 1 - Math.pow(1 - t, 3);
        position = source + (target - source) * ease;
        draw();
        if (t === 1) {
          moving = false;
          container!.dataset.moving = 'false';
          settled.current();
        }
      }
      if (!reduced && now - lastDraw > 33) {
        shards.forEach((s, i) => {
          s.rotation.y += 0.002 + i * 0.00005;
        });
        dust.rotation.z = now * 0.000006;
        webgl?.render(atmosphere, camera);
        lastDraw = now;
      }
      if (moving || (!reduced && webgl)) frame = requestAnimationFrame(tick);
    }
    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    controls.current = {
      target(value) {
        if (value === position && !moving) {
          container.dataset.moving = 'false';
          settled.current();
          return;
        }
        source = position;
        target = value;
        started = performance.now();
        moving = !reduced;
        container.dataset.moving = String(moving);
        if (reduced) {
          position = value;
          draw();
          settled.current();
        } else schedule();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    intersection.observe(container);
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    document.addEventListener('visibilitychange', visibility);
    const contextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      webgl = undefined;
      container.dataset.webgl = 'lost';
      schedule();
    };
    const canvas = webgl?.domElement;
    const ownedRenderer = webgl;
    canvas?.addEventListener('webglcontextlost', contextLost);
    resize();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas?.removeEventListener('webglcontextlost', contextLost);
      controls.current = null;
      cards.forEach((c) => scene.remove(c));
      triangle.dispose();
      geometry.dispose();
      dustMaterial.dispose();
      materials.forEach((m) => m.dispose());
      ownedRenderer?.dispose();
      ownedRenderer?.forceContextLoss();
      renderer.domElement.remove();
      canvas?.remove();
    };
  }, []);
  useEffect(() => {
    controls.current?.target(selected);
  }, [selected]);
  return (
    <div className="spiral-world">
      <header className="spiral-heading">
        <span className="section-label">THE GLASS COLLECTION / 01—04</span>
        <h2>
          Ideas into <em>real things.</em>
        </h2>
        <p>One gesture. A new perspective.</p>
      </header>
      <div ref={host} className="spiral-scene" aria-label="3D spiral project gallery" />
      <div className="spiral-orbit" aria-hidden="true" />
    </div>
  );
}
