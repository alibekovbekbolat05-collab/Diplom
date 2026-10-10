import {it,expect} from 'vitest';
import {generateBaseline,SIM_SEED} from '@/server/simulator';
import {normalize} from '@/server/parsers';
import {detect} from '@/server/detection';
it('has no complete-pipeline alerts on the declared baseline',()=>{const at=Date.UTC(2026,9,10,7);const rows=generateBaseline(SIM_SEED,at,at+15*60000).map(e=>({...normalize(e,'simulator'),simulation:true}));const found=detect(rows);expect(found.map(a=>a.type)).toEqual([]);});
