"""Verify exported tree inference matches Python-trained probability fixtures."""
import json,math
from pathlib import Path
model=json.loads((Path(__file__).resolve().parents[1]/'server/ml/model.json').read_text())
def leaf(t,x):
    while not t['leaf']:t=t['l'] if x[t['f']]<=t['t'] else t['r']
    return t['v']
for row in model['parity_fixture']:
    p=1/(1+math.exp(-(model['base']+model['lr']*sum(leaf(t,row['x']) for t in model['trees']))))
    assert abs(p-row['p'])<1e-6,(p,row['p'])
print('Python model parity:',len(model['parity_fixture']),'fixtures passed')
