"""Train a compact classifier and export the exact TypeScript inference format.
Synthetic mode uses the existing documented Node generator (seed 42).
CSV mode expects the ten normalized features and a binary label column.
"""
import argparse,json,subprocess
from pathlib import Path
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score,precision_score,recall_score,f1_score,roc_auc_score,confusion_matrix,classification_report
from sklearn.model_selection import train_test_split
ROOT=Path(__file__).resolve().parents[1]
FEATURES=['duration_s','bytes_in','bytes_out','packets','pkts_per_s','bytes_ratio','dst_port','mean_pkt_size','syn_count','fin_count']
def tree_json(tree,node=0):
    if tree.children_left[node]==tree.children_right[node]: return {'leaf':True,'v':float(tree.value[node][0][0])}
    return {'leaf':False,'f':int(tree.feature[node]),'t':float(tree.threshold[node]),'l':tree_json(tree,int(tree.children_left[node])),'r':tree_json(tree,int(tree.children_right[node]))}
def run():
    p=argparse.ArgumentParser();p.add_argument('--csv',type=Path);p.add_argument('--dataset-name');p.add_argument('--synthetic',action='store_true');args=p.parse_args()
    if not args.csv and not args.synthetic:p.error('Choose --synthetic or --csv with --dataset-name')
    if args.csv:
        import csv
        if not args.dataset_name:p.error('--dataset-name is required for a real CSV')
        with args.csv.open(newline='') as f:rows=list(csv.DictReader(f))
        x=np.asarray([[float(r[k]) for k in FEATURES] for r in rows]);y=np.asarray([int(r['label']) for r in rows]);
        if not np.isfinite(x).all() or set(y)-{0,1}:raise ValueError('Features must be finite and labels binary')
        xt,xv,yt,yv=train_test_split(x,y,test_size=.2,random_state=42,stratify=y);benchmark='user-supplied dataset: '+args.dataset_name
    else:
        data=json.loads(subprocess.check_output(['node','scripts/export-dataset.mjs'],cwd=ROOT,text=True));rows=data['rows'];x=np.asarray([[r[k] for k in FEATURES] for r in rows]);y=np.asarray([r['label'] for r in rows]);xv,xt=x[:2000],x[2000:];yv,yt=y[:2000],y[2000:];benchmark='synthetic'
    model=GradientBoostingClassifier(n_estimators=24,max_depth=4,learning_rate=.4,min_samples_leaf=20,random_state=42).fit(xt,yt)
    proba=model.predict_proba(xv)[:,1];pred=proba>=.5;tn,fp,fn,tp=confusion_matrix(yv,pred,labels=[0,1]).ravel()
    base=float(model._raw_predict_init(xt[:1])[0,0]);trees=[tree_json(t.tree_) for t in model.estimators_[:,0]]
    exported={'version':1,'kind':'gbdt-logistic','features':FEATURES,'base':base,'lr':.4,'trees':trees,'trained_on':benchmark+'; scikit-learn GradientBoostingClassifier; seed 42','parity_fixture':[{'x':v.tolist(),'p':float(prob)}for v,prob in zip(xv[:32],proba[:32])]}
    metrics={'benchmark':benchmark,'generator':'scripts/train-model.mjs seed=42' if not args.csv else str(args.csv.name),'trainer':'ml/train.py (scikit-learn)','test_size':len(xv),'train_size':len(xt),'accuracy':float(accuracy_score(yv,pred)),'precision':float(precision_score(yv,pred,zero_division=0)),'recall':float(recall_score(yv,pred,zero_division=0)),'f1':float(f1_score(yv,pred,zero_division=0)),'roc_auc':float(roc_auc_score(yv,proba)),'confusion':{k:int(v) for k,v in zip(['tp','fp','tn','fn'],[tp,fp,tn,fn])},'per_class':classification_report(yv,pred,output_dict=True,zero_division=0)}
    (ROOT/'server/ml/model.json').write_text(json.dumps(exported));(ROOT/'content/metrics.json').write_text(json.dumps(metrics,indent=2)+'\n');print(json.dumps({k:v for k,v in metrics.items() if k!='per_class'},indent=2))
if __name__=='__main__':run()
