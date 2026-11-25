import test from 'node:test'
import assert from 'node:assert/strict'
import { regions, volume, radii, affineRegion } from '../src/rotation.ts'
import { outerRadius, upperAngle, angleMin, angleMax } from '../src/lesson.ts'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6)
test('reference volumes and axis crossing',()=>{
  near(volume(regions[0],'x'),2*Math.PI/15)
  near(volume(regions[0],'y'),Math.PI/6)
  near(volume(regions[2],'y'),Math.PI/2)
  assert.deepEqual(radii([-3,1]),[0,3])
  assert.deepEqual(radii([-3,-1]),[1,3])
})
test('affine horizontal sections and unsupported expressions',()=>{
  const region=affineRegion('x+1','0',-1,1)
  assert.deepEqual(region.horizontal(.5),[-.5,1])
  near(volume(region,'y'),5*Math.PI/3)
  assert.throws(()=>affineRegion('sqrt(x)','0',-1,1))
})
test('polar swap endpoints',()=>{
  near(outerRadius(angleMin),Math.SQRT2)
  near(outerRadius(angleMax),0)
  near(upperAngle(Math.SQRT2),angleMin)
})


import { slices } from '../src/polarBands.ts'
test('disjoint polar intervals and reversed slices',()=>{
  assert.deepEqual(slices(Math.PI/4,false),[[.5,1],[1.5,2]])
  assert.deepEqual(slices(Math.PI/12,false),[[.5,1]])
  assert.deepEqual(slices(1.25,true),[])
  assert.deepEqual(slices(1.75,true),[[Math.PI/6,Math.PI/2]])
})

import { sweptRadii, subtractSpan, shellIntervals } from '../src/rotation.ts'
test('partial sweeps expose only non-overlapping angular strips',()=>{
  assert.deepEqual(sweptRadii([-3,1],true,false),[0,1])
  assert.deepEqual(sweptRadii([-3,1],false,true),[0,3])
  assert.deepEqual(subtractSpan([0,3],[0,1]),[[0,0],[1,3]])
  assert.deepEqual(subtractSpan([1,4],[2,3]),[[1,2],[3,4]])
  assert.deepEqual(shellIntervals(regions[2],'y',.5),[[.25,1]])
})


import { polarCases } from '../src/polarBands.ts'
test('eccentric disk tangent and lens boundary change',()=>{
  const offset=polarCases[2]
  const lens=polarCases[3]
  assert.deepEqual(offset.radial(0),[[1,3]])
  near(offset.radial(Math.PI/6)[0][1],Math.sqrt(3))
  assert.deepEqual(offset.angular(.5),[])
  near(lens.radial(Math.PI/3)[0][1],1)
  near(lens.radial(Math.PI/2)[0][1],0)
})
