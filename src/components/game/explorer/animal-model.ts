import type { Character } from "@/lib/explorer-character";

type Animal = Exclude<Character["kind"], "human">;
type Shape = [x: number, y: number, z: number, rx: number, ry: number, rz: number, color: string];

function animalShapes(kind: Animal, outfit: string, gear: Character["gear"]): Shape[] {
  const owl = kind === "owl", bunny = kind === "bunny";
  const fur = owl ? "#ab7d53" : bunny ? "#e4d8e8" : "#de8643";
  const cream = owl ? "#ffe7bc" : bunny ? "#fff1eb" : "#fff0ce";
  const dark = "#322a36", pink = "#ecaaa3";
  const shapes: Shape[] = [
    [0,-.49,0,.64,.68,.51,outfit], [0,.34,.04,.76,.68,.57,fur],

  ];
  for (const side of [-1,1]) {
    shapes.push([side*.61,-.41,.01,.19,.38,.23,fur],
      [side*.32,-1.04,.13,.24,.13,.29,owl ? "#e5a14b" : fur]);
    if (bunny) {
      shapes.push([side*.36,1.08,-.05,.17,.49,.15,fur],
        [side*.36,1.13,.058,.089,.34,.07,pink]);
    } else if (kind === "fox") {
      // Stack gently tapering sections for pointed ears and a cream inner ear.
      for (let layer = 0; layer < 14; layer++) {
        const t = layer / 14;
        const x = side * (.46 + .13 * t);
        const y = .80 + .40 * t;
        shapes.push([x, y, -.03, .22 * (1 - t), .06, .14 * (1 - t), fur]);
        if (layer < 10) shapes.push([x, y, .070 - .009 * layer, .115 * (1 - t), .046, .07 * (1 - t), pink]);
      }
    } else {
      shapes.push([side*.51,.82,-.05,.205,.30,.17,fur],
        [side*.54,.9,.047,.092,.135,.09,owl ? "#835e4d" : pink]);
    }
    shapes.push([side*.29,.40,.46,.32,.31,.15,cream],
      [side*.28,.42,.588,.145,.163,.070,dark],
      [side*.28-.044,.477,.65,.043,.045,.022,"#fffdf4"],
      [side*.43,.18,.49,.105,.052,.042,pink]);
  }
  if (owl) {
    shapes.push([0,.22,.60,.115,.144,.12,"#efae47"]);
    for (const x of [-.20,0,.20]) shapes.push([x,-.56,.49,.056,.077,.035,"#ffebbc"]);
  } else {
    shapes.push([-.095,.17,.566,.146,.106,.088,cream],[.095,.17,.566,.146,.106,.088,cream],
      [0,.245,.656,.085,.065,.066,bunny ? "#b77b80" : dark]);
    if (bunny) {
      shapes.push([0,-.72,-.47,.22,.22,.22,cream], [0,.107,.585,.045,.049,.035,"#fffaf2"]);
    } else {
      shapes.push([.62,-.70,-.41,.28,.38,.25,fur], [.76,-.43,-.42,.22,.30,.22,fur],
        [.84,-.20,-.42,.145,.19,.15,cream]);
    }
  }
  if (gear === "scarf") shapes.push([0,-.219,.13,.575,.115,.423,"#ed714f"],[.31,-.408,.457,.098,.20,.074,"#ec6849"]);
  if (gear === "pin") shapes.push([.27,-.49,.482,.117,.117,.046,"#f6c547"],[.27,-.49,.52,.058,.058,.022,"#ffec93"]);
  if (gear === "bow") shapes.push([.36,.89,.27,.135,.094,.075,"#ed689b"],[.59,.89,.19,.135,.094,.075,"#ed689b"],[.48,.88,.25,.055,.057,.06,"#c23c71"]);
  if (gear === "glasses" || gear === "headband") {
    const glasses = gear === "glasses";
    for (const side of glasses ? [-1,1] : [0]) {
      for (let i=0; i<40; i++) {
        const t = (glasses ? 2 : 1)*Math.PI*i/(glasses ? 40 : 39);
        shapes.push(glasses
          ? [side*.29+.226*Math.cos(t),.42+.205*Math.sin(t),.634,.037,.037,.035,"#374879"]
          : [.67*Math.cos(t),.32+.68*Math.sin(t),.22,.055,.056,.060,"#ef82ac"]);
      }
    }
    if (glasses) shapes.push([0,.44,.635,.084,.025,.025,"#374879"]);
  }
  if (gear === "crown") {
    shapes.push([0,1.00,.04,.35,.11,.27,"#efb33d"]);
    for (const x of [-.24,0,.24]) shapes.push([x,1.105,.09,.075,.15,.07,"#f7c955"]);
  }
  return shapes;
}

// Orthographic rendering of solid ellipsoids. Depth is tested per pixel, so
// ears, wings and accessories also work in side and rear views without WebGL.
export function drawAnimal(pixels: Uint8ClampedArray, size: number, kind: Animal, outfit: string, gear: Character["gear"], degrees: number) {
  const depth = new Float32Array(size*size).fill(-Infinity);
  const scale = size/3.06, mid = size/2, baseline = size*.565;
  const angle = degrees*Math.PI/180, co = Math.cos(angle), si = Math.sin(angle);
  for (const [x,y,z,rx,ry,rz,color] of animalShapes(kind,outfit,gear)) {
    const cx = co*x+si*z, cz = co*z-si*x;
    const width = Math.hypot(rx*co,rz*si);
    const ix=1/(rx*rx), iy=1/(ry*ry), iz=1/(rz*rz);
    const a=si*si*ix+co*co*iz;
    const rgb=parseInt(color.slice(1),16);
    const red=rgb>>16, green=(rgb>>8)&255, blue=rgb&255;
    const left=Math.max(0,Math.floor(mid+(cx-width)*scale)), right=Math.min(size-1,Math.ceil(mid+(cx+width)*scale));
    const top=Math.max(0,Math.floor(baseline-(y+ry)*scale)), bottom=Math.min(size-1,Math.ceil(baseline-(y-ry)*scale));
    for(let row=top;row<=bottom;row++) {
      const dy=(baseline-row-.5)/scale-y;
      for(let col=left;col<=right;col++) {
        const dx=(col+.5-mid)/scale-cx;
        const b=dx*co*si*(iz-ix);
        const c=dx*dx*(co*co*ix+si*si*iz)+dy*dy*iy-1;
        const discriminant=b*b-a*c;
        if(discriminant<0) continue;
        const dz=(Math.sqrt(discriminant)-b)/a;
        const index=row*size+col;
        if(cz+dz<=depth[index]) continue;
        depth[index]=cz+dz;
        const nx=(co*dx-si*dz)*ix, nz=(si*dx+co*dz)*iz, ny=dy*iy;
        const light=(-(co*nx+si*nz)*.4+ny*.62+(co*nz-si*nx)*.67)/Math.hypot(nx,ny,nz);
        const shade=.72+.32*Math.max(0,light);
        pixels[index*4]=red*shade; pixels[index*4+1]=green*shade;
        pixels[index*4+2]=blue*shade; pixels[index*4+3]=255;
      }
    }
  }
}
