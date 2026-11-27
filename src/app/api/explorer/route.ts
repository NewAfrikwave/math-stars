import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentForRequest } from "@/lib/student";
import { validEntry, type Entry } from "@/lib/explorer";

export const dynamic = "force-dynamic";
async function profile(req:Request) {
  if(!req.headers.get("x-profile-id")) return null;
  try { return await getStudentForRequest(req); } catch { return null; }
}
export async function GET(req:Request) {
  const student=await profile(req);
  if(!student) return NextResponse.json({error:"Profile unavailable"},{status:403});
  const rows=await db.explorerEntry.findMany({where:{studentId:student.id,OR:[
    {at:{gte:new Date(Date.now()-32*86400000)}},{key:{startsWith:"stamp/"}},{key:{startsWith:"slot/"}},{key:{startsWith:"book/"}},{key:{startsWith:"bookhelp/"}}
  ]},select:{key:true,value:true,at:true}});
  return NextResponse.json({entries:rows.map(e=>({...e,at:e.at.getTime()}))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:Request) {
  const student=await profile(req);
  if(!student) return NextResponse.json({error:"Profile unavailable"},{status:403});
  const body=await req.json().catch(()=>null);
  if(!Array.isArray(body?.entries) || !body.entries.length || body.entries.length>80 || !body.entries.every(validEntry))
    return NextResponse.json({error:"Invalid practice update"},{status:400});
  // Ordered writes use the same tie-break as the client. Replaying an older offline
  // batch cannot undo a newer room arrangement made on another device.
  await db.$transaction(async tx=>{
    for(const e of body.entries as Entry[]) {
      const at=new Date(e.at);
      const where={studentId:student.id,key:e.key};
      await tx.explorerEntry.upsert({where:{studentId_key:where},create:{...where,value:e.value,at},update:{}});
      await tx.explorerEntry.updateMany({where:{...where,OR:[{at:{lt:at}},{at,value:{lt:e.value}}]},data:{at,value:e.value}});
    }
  });
  return NextResponse.json({saved:true});
}
