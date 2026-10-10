"""Convert CICFlowMeter CSV into the ten documented training features.
Run locally; input datasets and output CSV files are not bundled or deployed.
"""
import argparse,csv,math,json
from pathlib import Path
FEATURES=['duration_s','bytes_in','bytes_out','packets','pkts_per_s','bytes_ratio','dst_port','mean_pkt_size','syn_count','fin_count']
def convert(row):
    r={k.strip():v.strip() for k,v in row.items() if k is not None and isinstance(v,str)}
    def n(*keys,default=None):
        for key in keys:
            if key in r and r[key]!='':return float(r[key])
        if default is not None:return default
        raise ValueError('Missing feature: '+keys[0])
    duration=max(.001,n('Flow Duration','FlowDuration')/1_000_000)
    outbound=n('Total Length of Fwd Packets','TotLen Fwd Pkts')
    inbound=n('Total Length of Bwd Packets','TotLen Bwd Pkts')
    packets=n('Total Fwd Packets','Tot Fwd Pkts')+n('Total Backward Packets','Tot Bwd Pkts')
    if packets<=0:raise ValueError('Empty flow')
    label=r.get('Label','').upper()
    if not label:raise ValueError('Missing label')
    values=[duration,inbound,outbound,packets,packets/duration,outbound/max(1,inbound),n('Destination Port','Dst Port'),(inbound+outbound)/packets,n('SYN Flag Count','SYN Flag Cnt',default=1),n('FIN Flag Count','FIN Flag Cnt',default=0)]
    if not all(math.isfinite(v)and v>=0 for v in values):raise ValueError('Invalid feature')
    return dict(zip(FEATURES,values))|{'label':0 if label in {'BENIGN','NORMAL'} else 1}
def main():
    p=argparse.ArgumentParser();p.add_argument('input',type=Path);p.add_argument('output',type=Path);p.add_argument('--max-rows',type=int,default=250000);args=p.parse_args()
    if not 1<=args.max_rows<=1000000:p.error('--max-rows must be 1..1000000')
    accepted=skipped=0;seen=set()
    with args.input.open(newline='',encoding='utf-8-sig') as source,args.output.open('w',newline='') as output:
        writer=csv.DictWriter(output,fieldnames=FEATURES+['label']);writer.writeheader()
        for row in csv.DictReader(source):
            try:flow=convert(row)
            except (ValueError,TypeError):skipped+=1;continue
            key=tuple(flow.values())
            if key in seen:skipped+=1;continue
            seen.add(key);writer.writerow(flow);accepted+=1
            if accepted>=args.max_rows:break
    print(json.dumps({'accepted':accepted,'skipped':skipped,'max_rows':args.max_rows}))
if __name__=='__main__':main()
