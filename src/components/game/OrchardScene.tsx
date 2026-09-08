"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ORCHARD_TOTAL } from "@/lib/equal-groups-lesson";

interface Props {
  counts: number[];
  holding: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  onPick: () => void;
  onPlace: (basket: number) => void;
}

/** Real, locally generated meshes; equivalent controls always live outside the canvas. */
export function OrchardScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef(props);
  const update = useRef<(() => void) | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { actions.current = props; update.current?.(); }, [props]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); }
    catch { queueMicrotask(() => setUnavailable(true)); return; }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e4eddf");
    const camera = new THREE.OrthographicCamera(-4.5, 4.5, 3.4, -3.4, 0.1, 40);
    camera.position.set(0, 10, 9); camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y";
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff7e5, 0x42604b, 2.8));
    const sun = new THREE.DirectionalLight(0xfff4d3, 3);
    sun.position.set(-3, 8, 3); sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512); sun.shadow.normalBias = 0.04;
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
    scene.add(sun);
    const materials: THREE.Material[] = [];
    const material = (color: string) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 }); materials.push(m); return m; };
    const wood = material("#bd8b51"), rim = material("#93623b"), red = material("#dc5038"), green = material("#416d37"), stem = material("#60402d");
    const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = scene) => {
      const object = new THREE.Mesh(geometry, mat); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
    };
    const ground = mesh(new THREE.BoxGeometry(10, 0.2, 7), material("#c8d9b8")); ground.position.y = -0.3;
    const tray = mesh(new THREE.BoxGeometry(3.2, 0.12, 1.35), wood); tray.position.set(0, -0.08, -1.6);
    tray.userData.pool = true;
    const xs = [-2.5, 0, 2.5];
    const baskets = xs.map((x, index) => {
      const group = new THREE.Group(); scene.add(group); group.position.set(x, 0, 1.1);
      const base = mesh(new THREE.BoxGeometry(1.95, 0.14, 1.85), wood, group);
      for (const z of [-0.91, 0.91]) {
        const wall = mesh(new THREE.BoxGeometry(1.95, 0.27, 0.07), rim, group); wall.position.set(0, 0.11, z);
      }
      for (const side of [-0.94, 0.94]) {
        const wall = mesh(new THREE.BoxGeometry(0.07, 0.27, 1.85), rim, group); wall.position.set(side, 0.11, 0);
      }
      const handle = mesh(new THREE.TorusGeometry(0.72, 0.055, 8, 32, Math.PI), rim, group);
      handle.position.set(0, 0.1, -0.91);
      group.traverse((object) => { object.userData.basket = index; });
      return base;
    });
    const apples = Array.from({ length: ORCHARD_TOTAL }, () => {
      const group = new THREE.Group(); scene.add(group);
      const fruit = mesh(new THREE.SphereGeometry(0.18, 16, 12), red, group); fruit.scale.set(1, 0.92, 1);
      const stalk = mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.13, 6), stem, group); stalk.position.y = 0.2;
      const leaf = mesh(new THREE.SphereGeometry(0.085, 8, 6), green, group); leaf.scale.set(1, 0.2, 0.5); leaf.position.set(0.07, 0.23, 0);
      return group;
    });
    let frame = 0, disposed = false;
    const draw = () => { if (!disposed && !document.hidden) renderer.render(scene, camera); };
    const targets = () => {
      const current = actions.current;
      const placed = current.counts.reduce((sum, n) => sum + n, 0);
      return apples.map((apple, index) => {
        let offset = index;
        for (let basket = 0; basket < current.counts.length; basket++) {
          if (offset < current.counts[basket]) {
            apple.traverse((object) => { object.userData = { basket }; });
            return new THREE.Vector3(xs[basket] + (offset % 3 - 1) * 0.5, 0.36, 1.1 + (Math.floor(offset / 3) - 1.5) * 0.42);
          }
          offset -= current.counts[basket];
        }
        apple.traverse((object) => { object.userData = { pool: true }; });
        const poolIndex = index - placed;
        return new THREE.Vector3((poolIndex % 6 - 2.5) * 0.45, current.holding && poolIndex === 0 ? 0.85 : 0.3, -1.6 + (Math.floor(poolIndex / 6) - 0.5) * 0.48);
      });
    };
    const refresh = (instant = false) => {
      cancelAnimationFrame(frame);
      const start = performance.now(), from = apples.map((apple) => apple.position.clone()), to = targets();
      const animate = () => {
        const t = instant || actions.current.reducedMotion ? 1 : Math.min(1, (performance.now() - start) / 350);
        apples.forEach((apple, i) => {
          apple.position.lerpVectors(from[i], to[i], 1 - (1 - t) ** 3);
          if (from[i].distanceToSquared(to[i]) > 0.01) apple.position.y += Math.sin(t * Math.PI) * 0.45;
        });
        draw(); if (t < 1 && !document.hidden) frame = requestAnimationFrame(animate);
      };
      animate();
    };
    update.current = refresh;
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      const halfHeight = Math.max(2.7, 4.15 * height / width);
      camera.left = -halfHeight * width / height; camera.right = -camera.left;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(element);
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const click = (event: MouseEvent) => {
      if (!actions.current.interactive) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects([...apples, tray, ...baskets.map((base) => base.parent!)], true)
        .map((entry) => entry.object.userData).find((data) => data.pool || data.basket !== undefined);
      if (hit?.pool) actions.current.onPick();
      else if (hit?.basket !== undefined) actions.current.onPlace(hit.basket);
    };
    const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); setUnavailable(true); };
    const visibility = () => { if (document.hidden) cancelAnimationFrame(frame); else refresh(true); };
    renderer.domElement.addEventListener("click", click);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", visibility);
    resize(); refresh(true);
    return () => {
      disposed = true; update.current = null; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("click", click); renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((object) => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
      geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); sun.shadow.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className="overflow-hidden rounded-3xl border border-[#b8c8a7] bg-[#e4eddf]">
    <div ref={host} className={unavailable ? "hidden" : "aspect-[1.35] sm:aspect-[1.8]"} data-testid="orchard-3d-scene" />
    {unavailable && <p role="status" className="p-6 text-center">3D is unavailable. Use the basket controls below to keep learning.</p>}
  </div>;
}
