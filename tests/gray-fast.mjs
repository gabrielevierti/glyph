/** Node 22+ lightweight validation of Gray4 preview conversion. */
import assert from 'node:assert/strict';
import { grayToRgba, packGray4, unpackGray4 } from '../src/glyph/gray.ts';
const levels = Uint8Array.from({length:256},(_,i)=>i%16);
const rgba = grayToRgba(levels);
for(let i=0;i<levels.length;i++) {
  assert.equal(rgba[4*i], levels[i]*17);
  assert.equal(rgba[4*i+1], levels[i]*17);
  assert.equal(rgba[4*i+2], levels[i]*17);
  assert.equal(rgba[4*i+3], 255);
}
assert.deepEqual(unpackGray4(packGray4(levels,16,16),16,16),levels);
console.log('Gray4 preview and packing: PASS');
