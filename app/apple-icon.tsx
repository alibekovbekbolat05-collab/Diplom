import { ImageResponse } from "next/og";
export const size={width:180,height:180};export const contentType="image/png";
export default function Icon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#080c11",color:"#31e6ff",fontSize:110,fontWeight:700,borderRadius:32}}>A</div>,size);}
