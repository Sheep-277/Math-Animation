<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { radii, section, type Axis, type Region, type Span, subtractSpan, shellIntervals, sweptRadii } from './rotation'

const p = defineProps<{region: Region; axis: Axis; degrees: number; position: number; slice: boolean; shell: boolean; wire: boolean; transparent: boolean; axes: boolean; grid: boolean; trail: boolean}>()
const host = ref<HTMLElement>()
const unavailable = ref(false)
let renderer: T.WebGLRenderer | undefined
let controls: OrbitControls | undefined
let resize: ResizeObserver | undefined
const scene = new T.Scene()
const camera = new T.PerspectiveCamera(38,1,.01,100)
const content = new T.Group()
scene.add(content)
const render = () => renderer?.render(scene,camera)

function clear(group: T.Group) {
  for (const object of group.children.slice()) {
    const mesh = object as T.Mesh
    mesh.geometry?.dispose()
    if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
    else mesh.material?.dispose()
    group.remove(object)
  }
}

function point(s: number, r: number, t: number) {
  return p.axis === 'x' ? [s,r*Math.cos(t),r*Math.sin(t)] : [r*Math.cos(t),s,-r*Math.sin(t)]
}

function surface(vertex: (u: number,v: number) => number[], rows: number, columns: number, color: number, opacity: number, wire = false) {
  const positions: number[] = []
  const indices: number[] = []
  for (let i=0;i<=rows;i++) {
    for (let j=0;j<=columns;j++) {
      positions.push(...vertex(i/rows,j/columns))
      if (i<rows && j<columns) {
        const k=i*(columns+1)+j
        indices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1)
      }
    }
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  content.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color,side:T.DoubleSide,wireframe:wire,opacity,transparent:opacity<1,depthWrite:opacity===1})))
}

const lerp = ([a,b]: Span,t:number) => a+(b-a)*t
function draw() {
  if (!renderer) return
  clear(content)
  const max = Math.max(...p.region.x.map(Math.abs),...p.region.y.map(Math.abs),.1)
  content.scale.setScalar(1/max)
  const domain = p.region[p.axis]
  const bounds = (u:number) => section(p.region,p.axis,lerp(domain,u))
  const angle=p.degrees*Math.PI/180
  const opacity=p.transparent ? .53 : 1
  const color=0x367bcb
  if (angle===0) {
    surface((u,v)=>point(lerp(domain,u),lerp(bounds(u),v),0),64,1,0x2baba7,.83)
  } else {
    const turn=2*Math.PI
    const stops=[...new Set([0,Math.PI,turn,angle,(angle+Math.PI)%turn])].sort((a,b)=>a-b)
    const bands=stops.slice(1).map((end,k)=>{
      const start=stops[k]!
      const mid=(start+end)/2
      return {start,end,positive:mid<angle,negative:(mid+Math.PI)%turn<angle}
    })
    for (const [k,band] of bands.entries()) {
      const {start,end,positive,negative}=band
      const radial=(u:number)=>sweptRadii(bounds(u),positive,negative)
      const count=Math.max(2,Math.ceil((end-start)*8))
      if (positive || negative) {
        for (const index of [0,1] as const) surface((u,v)=>point(lerp(domain,u),radial(u)[index],lerp([start,end],v)),64,count,color,opacity,p.wire)
        for (const edge of [0,1]) surface((u,v)=>point(lerp(domain,edge),lerp(radial(edge),u),lerp([start,end],v)),1,count,color,opacity,p.wire)
      }
      const previous=bands[(k+bands.length-1)%bands.length]!
      if (previous.positive===positive && previous.negative===negative) continue
      const difference=(u:number)=>subtractSpan(radial(u),sweptRadii(bounds(u),previous.positive,previous.negative))
      const opposite=(u:number)=>subtractSpan(sweptRadii(bounds(u),previous.positive,previous.negative),radial(u))
      for (const strip of [difference,opposite]) {
        for (const index of [0,1] as const) surface((u,v)=>point(lerp(domain,u),lerp(strip(u)[index],v),start),64,1,0x2baba7,opacity,p.wire)
      }
    }
  }
  if (p.slice) {
    if (p.shell) {
      for (const interval of shellIntervals(p.region,p.axis,Math.abs(p.position))) {
        surface((u,v)=>point(lerp(interval,u),Math.abs(p.position),v*2*Math.PI),1,64,0xf79536,.77)
      }
    } else {
      const r=radii(section(p.region,p.axis,p.position))
      surface((u,v)=>point(p.position,lerp(r,u),v*2*Math.PI),1,64,0xf79536,.85)
      line([point(p.position,0,0),point(p.position,r[1],0)],0x9d4116)
      line([point(p.position,0,.28),point(p.position,r[0],.28)],0xfce0ad)
    }
  }
  if (p.trail) {
    const s=lerp(domain,.45)
    const r=bounds(.45)[1]
    line(Array.from({length:65},(_,i)=>point(s,r,angle*i/64)),0xe08340)
  }
  if (p.grid) content.add(new T.GridHelper(3*max,12,0xacbbcb,0xd2deea))
  if (p.axes) content.add(new T.AxesHelper(1.4*max))
  const axisEnds: Span = [-1.35*max,1.35*max]
  if (p.axes) line(axisEnds.map(s=>point(s,0,0)),0x7555a5)
  render()
}

function line(points:number[][], color:number) {
  const geo=new T.BufferGeometry()
  geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3))
  content.add(new T.Line(geo,new T.LineBasicMaterial({color})))
}

onMounted(()=>{
  const container=host.value!
  try { renderer=new T.WebGLRenderer({antialias:true,alpha:true}) } catch { unavailable.value=true; return }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
  container.append(renderer.domElement)
  camera.position.set(2.8,2.1,3.4)
  controls=new OrbitControls(camera,renderer.domElement)
  controls.target.set(.24,.24,0)
  controls.update()
  controls.addEventListener('change',render)
  scene.add(new T.HemisphereLight(0xffffff,0x708aab,2))
  const light=new T.DirectionalLight(0xffffff,2)
  light.position.set(3,4,3)
  scene.add(light)
  resize=new ResizeObserver(()=>{
    if (!container.clientWidth || !container.clientHeight) return
    camera.aspect=container.clientWidth/container.clientHeight
    camera.updateProjectionMatrix()
    renderer?.setSize(container.clientWidth,container.clientHeight)
    render()
  })
  resize.observe(container)
  draw()
})
watch(()=>[p.region,p.axis,p.degrees,p.position,p.slice,p.shell,p.wire,p.transparent,p.axes,p.grid,p.trail],draw)
onBeforeUnmount(()=>{resize?.disconnect();controls?.dispose();clear(content);renderer?.dispose()})
</script>

<template><div ref="host" class="solid-view"><p v-if="unavailable" role="status">此浏览器无法创建 WebGL 场景。仍可使用二维图和截面积计算。</p></div></template>
