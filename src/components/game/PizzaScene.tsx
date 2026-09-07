"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { PizzaChallenge } from "@/lib/pizza-party";

interface Props {
  challenge: PizzaChallenge;
  placements: number[];
  selected: number | null;
  disabled: boolean;
  reducedMotion: boolean;
  onPick: (slice: number) => void;
  onPlace: (plate: number, slice?: number) => void;
}

/** Procedural meshes: no remote models, textures, CDNs, or continuous render loop. */
export function PizzaScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef(props);
  const update = useRef<(() => void) | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { actions.current = props; update.current?.(); }, [props]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      queueMicrotask(() => setUnavailable(true));
      return;
    }
    const p = props.challenge;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9eddd");
    const camera = new THREE.OrthographicCamera(-4.8, 4.8, 3.7, -3.7, 0.1, 40);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff7df, 0x4f6853, 2.6));
    const light = new THREE.DirectionalLight(0xfff3d1, 3.2);
    light.position.set(-3, 8, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -6; light.shadow.camera.right = 6;
    light.shadow.camera.top = 6; light.shadow.camera.bottom = -6;
    light.shadow.normalBias = 0.04;
    scene.add(light);
    const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const wood = material("#b88754"), boardMat = material("#e3b879"), crust = material("#d99b44");
    const sauce = material("#bc4737"), cheese = material("#ffcf68"), tomato = material("#ca4d38"), basil = material("#4a7a42");
    const plateColors = ["#f6f3de", "#f1dad0", "#d9e7e9", "#e4dcf0"];
    const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = scene) => {
      const object = new THREE.Mesh(geometry, mat);
      object.castShadow = true; object.receiveShadow = true;
      parent.add(object); return object;
    };
    const table = mesh(new THREE.CylinderGeometry(7, 7, 0.35, 64), wood);
    table.position.y = -0.5;
    const board = mesh(new THREE.CylinderGeometry(1.93, 1.93, 0.16, 64), boardMat);
    board.position.set(0, -0.18, -1.5);
    board.userData.plate = -1;
    const handle = mesh(new THREE.BoxGeometry(0.6, 0.14, 0.8), boardMat);
    handle.position.set(0, -0.18, -3.6);
    const plateXs = Array.from({ length: p.plates }, (_, i) => (i - (p.plates - 1) / 2) * 2.25);
    const plates = plateXs.map((x, i) => {
      const plate = mesh(new THREE.CylinderGeometry(1.02, 0.88, 0.13, 48), material(plateColors[i]));
      plate.position.set(x, -0.21, 1.65); plate.userData.plate = i;
      const rim = mesh(new THREE.TorusGeometry(0.95, 0.065, 8, 48), material("#55796a"));
      rim.rotation.x = Math.PI / 2; rim.position.set(x, -0.11, 1.65); rim.userData.plate = i;
      return plate;
    });
    const step = Math.PI * 2 / p.slices;
    const slices = Array.from({ length: p.slices }, (_, i) => {
      const group = new THREE.Group(); scene.add(group);
      const start = i * step + 0.025, arc = step - 0.05;
      const dough = mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.16, 28, 1, false, start, arc), crust, group);
      dough.position.y = 0.03;
      const red = mesh(new THREE.CylinderGeometry(1.53, 1.53, 0.04, 28, 1, false, start, arc), sauce, group);
      red.position.y = 0.13;
      const top = mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.035, 28, 1, false, start, arc), cheese, group);
      top.position.y = 0.16;
      const angle = start + arc / 2;
      for (const radius of [0.62, 1.16]) {
        const topping = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.025, 14), tomato, group);
        topping.position.set(Math.sin(angle) * radius, 0.195, Math.cos(angle) * radius);
      }
      const leaf = mesh(new THREE.SphereGeometry(0.10, 8, 6), basil, group);
      leaf.scale.set(0.55, 0.25, 1.25);
      leaf.position.set(Math.sin(angle + arc * 0.2), 0.21, Math.cos(angle + arc * 0.2));
      group.traverse((object) => { object.userData.slice = i; });
      group.position.set(0, 0, -1.5);
      return group;
    });
    let frame = 0;
    let disposed = false;
    const draw = () => { if (!disposed && !document.hidden) renderer.render(scene, camera); };
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      const minimumWidth = p.plates > 2 ? 4.8 : 3.5;
      const halfHeight = Math.max(2.9, minimumWidth * height / width);
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth; camera.right = halfWidth;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(element);
    const refresh = () => {
      cancelAnimationFrame(frame);
      const current = actions.current;
      const starts = slices.map((slice) => ({ position: slice.position.clone(), scale: slice.scale.x }));
      const targets = slices.map((_, i) => {
        const plate = current.placements[i];
        return { position: new THREE.Vector3(plate < 0 ? 0 : plateXs[plate], current.selected === i ? 0.55 : 0, plate < 0 ? -1.5 : 1.65), scale: plate < 0 ? 1 : 0.49 };
      });
      const start = performance.now();
      const animate = () => {
        const t = current.reducedMotion ? 1 : Math.min(1, (performance.now() - start) / 280);
        const eased = 1 - Math.pow(1 - t, 3);
        slices.forEach((slice, i) => {
          slice.position.lerpVectors(starts[i].position, targets[i].position, eased);
          slice.scale.setScalar(THREE.MathUtils.lerp(starts[i].scale, targets[i].scale, eased));
        });
        draw();
        if (t < 1 && !document.hidden) frame = requestAnimationFrame(animate);
      };
      animate();
    };
    update.current = refresh;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitAt = (event: PointerEvent, plateOnly = false) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(plateOnly ? [board, ...plates] : scene.children, true)
        .map((hit) => hit.object.userData).find((data) => data.slice !== undefined || data.plate !== undefined);
    };
    let down: { x: number; y: number; slice?: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (actions.current.disabled || event.button !== 0) return;
      const hit = hitAt(event);
      down = { x: event.clientX, y: event.clientY, slice: hit?.slice };
      renderer.domElement.setPointerCapture(event.pointerId);
      if (hit?.slice !== undefined) actions.current.onPick(hit.slice);
    };
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.7);
    const dragPoint = new THREE.Vector3();
    const pointerMove = (event: PointerEvent) => {
      if (actions.current.disabled || down?.slice === undefined) return;
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) < 8) return;
      cancelAnimationFrame(frame);
      hitAt(event); // update the pointer ray
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
        slices[down.slice].position.copy(dragPoint);
        draw();
      }
    };
    const pointerUp = (event: PointerEvent) => {
      if (!down || actions.current.disabled) { down = null; return; }
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8;
      const hit = hitAt(event, moved && down.slice !== undefined);
      if (hit?.plate !== undefined) actions.current.onPlace(hit.plate, moved ? down.slice : undefined);
      down = null;
      refresh();
    };
    const pointerCancel = () => { down = null; refresh(); };
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); setUnavailable(true); };
    const visibility = () => { if (document.hidden) cancelAnimationFrame(frame); else refresh(); };
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointercancel", pointerCancel); canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", visibility);
    resize(); refresh();
    return () => {
      disposed = true; update.current = null; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointercancel", pointerCancel); canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
        }
      });
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose());
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [props.challenge]);

  return <div className="relative overflow-hidden rounded-[24px] border border-[#cccfb5] bg-[#e9eddd]">
    <div ref={host} className={unavailable ? "hidden" : "aspect-[1.25] w-full sm:aspect-[1.65]"} data-testid="pizza-3d-scene" />
    {unavailable ? <p role="status" className="p-6 text-center font-semibold text-[#345c46]">3D is unavailable on this device. All the slice and plate buttons below still work.</p>
      : <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black tracking-wide text-[#345c46]">3D PIZZA KITCHEN · PICK & SERVE</span>}
  </div>;
}
