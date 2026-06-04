import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther, formatEther } from "viem";
const ADDR = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
const ACCENT = "#f97316";
const ABI = [
  { name:"register", type:"function", stateMutability:"payable", inputs:[{name:"title",type:"string"},{name:"description",type:"string"}], outputs:[{type:"uint256"}] },
  { name:"listForSale", type:"function", stateMutability:"nonpayable", inputs:[{name:"id",type:"uint256"},{name:"price",type:"uint256"}], outputs:[] },
  { name:"purchase", type:"function", stateMutability:"payable", inputs:[{name:"id",type:"uint256"}], outputs:[] },
  { name:"getDeed", type:"function", stateMutability:"view", inputs:[{name:"id",type:"uint256"}], outputs:[{type:"tuple",components:[{name:"owner",type:"address"},{name:"title",type:"string"},{name:"description",type:"string"},{name:"registeredAt",type:"uint256"},{name:"forSale",type:"bool"},{name:"price",type:"uint256"}]}] },
  { name:"getMyDeeds", type:"function", stateMutability:"view", inputs:[{name:"user",type:"address"}], outputs:[{type:"uint256[]"}] },
  { name:"totalDeeds", type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
] as const;
const s: Record<string,React.CSSProperties> = {
  page:{minHeight:"100vh",background:"#080b14",color:"#e2e8f0",fontFamily:"Inter,sans-serif",padding:"24px"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32},
  title:{fontSize:24,fontWeight:700,color:ACCENT},
  tabs:{display:"flex",gap:8,marginBottom:24},
  tab:(a:boolean)=>({padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",background:a?ACCENT:"#1e2533",color:a?"#000":"#94a3b8",fontWeight:600}),
  card:{background:"#111827",borderRadius:12,padding:20,marginBottom:16,border:"1px solid #1e2533"},
  label:{display:"block",fontSize:13,color:"#94a3b8",marginBottom:6},
  input:{width:"100%",background:"#1e2533",border:"1px solid #374151",borderRadius:8,padding:"10px 14px",color:"#e2e8f0",fontSize:14,boxSizing:"border-box" as const,marginBottom:14},
  btn:{background:ACCENT,color:"#000",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:14,marginRight:8},
};
type Deed={owner:string;title:string;description:string;registeredAt:bigint;forSale:boolean;price:bigint};
function DeedCard({id}:{id:bigint}){
  const {address}=useAccount();
  const {data}=useReadContract({address:ADDR,abi:ABI,functionName:"getDeed",args:[id]});
  const {writeContract,data:hash,isPending}=useWriteContract();
  const {isLoading}=useWaitForTransactionReceipt({hash});
  if(!data)return null;
  const d=data as Deed;
  const isOwner=address?.toLowerCase()===d.owner.toLowerCase();
  return(
    <div style={s.card}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontWeight:700}}>📜 {d.title}</span>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:d.forSale?ACCENT+"22":"#1e2533",color:d.forSale?ACCENT:"#64748b"}}>{d.forSale?"For Sale":"Owned"}</span>
      </div>
      <div style={{fontSize:13,color:"#94a3b8",marginBottom:8}}>{d.description}</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Owner: {d.owner.slice(0,16)}... • {new Date(Number(d.registeredAt)*1000).toLocaleDateString()}</div>
      {d.forSale&&<div style={{marginBottom:10}}><span style={{color:ACCENT,fontWeight:700}}>{formatEther(d.price)} ETH</span></div>}
      {!isOwner&&d.forSale&&<button style={{...s.btn,opacity:isPending||isLoading?0.6:1}} onClick={()=>writeContract({address:ADDR,abi:ABI,functionName:"purchase",args:[id],value:d.price})} disabled={isPending||isLoading}>{isPending||isLoading?"Buying...":"Buy Deed"}</button>}
    </div>
  );
}
export default function App(){
  const {isConnected,address}=useAccount();
  const [tab,setTab]=useState<"browse"|"mine"|"register">("browse");
  const [form,setForm]=useState({title:"",description:""});
  const {writeContract,data:hash,isPending}=useWriteContract();
  const {isLoading:confirming}=useWaitForTransactionReceipt({hash});
  const {data:total}=useReadContract({address:ADDR,abi:ABI,functionName:"totalDeeds"});
  const {data:myDeeds}=useReadContract({address:ADDR,abi:ABI,functionName:"getMyDeeds",args:[address!],query:{enabled:!!address}});
  const ids=total?Array.from({length:Number(total)},(_,i)=>BigInt(i)):[];
  return(
    <div style={s.page}>
      <div style={s.header}><div><div style={s.title}>📜 WindDeed</div><div style={{fontSize:13,color:"#64748b"}}>On-chain deed registry • {total?.toString()??0} deeds</div></div><ConnectButton/></div>
      {!isConnected?<div style={{textAlign:"center",padding:60,color:"#64748b"}}>Connect wallet to register or buy deeds</div>:(
        <><div style={s.tabs}><button style={s.tab(tab==="browse")} onClick={()=>setTab("browse")}>Browse</button><button style={s.tab(tab==="mine")} onClick={()=>setTab("mine")}>My Deeds</button><button style={s.tab(tab==="register")} onClick={()=>setTab("register")}>Register</button></div>
        {tab==="browse"&&<div>{ids.length?[...ids].reverse().map(id=><DeedCard key={id.toString()} id={id}/>):<div style={{color:"#64748b",padding:20}}>No deeds registered yet</div>}</div>}
        {tab==="mine"&&<div>{(myDeeds as bigint[])?.length?(myDeeds as bigint[]).map(id=><DeedCard key={id.toString()} id={id}/>):<div style={{color:"#64748b",padding:20}}>No deeds owned</div>}</div>}
        {tab==="register"&&<div style={s.card}>
          <div style={{fontWeight:700,marginBottom:8}}>Register New Deed</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>Registration fee: 0.001 ETH</div>
          <label style={s.label}>Title</label><input style={s.input} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Property name, asset title..."/>
          <label style={s.label}>Description</label><input style={s.input} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Asset description..."/>
          <button style={{...s.btn,opacity:(isPending||confirming)?0.6:1}} onClick={()=>writeContract({address:ADDR,abi:ABI,functionName:"register",args:[form.title,form.description],value:parseEther("0.001")})} disabled={isPending||confirming}>{isPending||confirming?"Registering...":"Register Deed 📜"}</button>
        </div>}</>
      )}
    </div>
  );
}