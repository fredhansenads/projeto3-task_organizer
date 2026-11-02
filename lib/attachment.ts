const types:Record<string,string>={
  pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",
  docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Os formatos Office são identificados pelo diretório central, sem descompactar conteúdo.
function officePackage(bytes:Buffer, entry:string) {
  for(let end=bytes.length-22;end>=Math.max(0,bytes.length-65557);end--) {
    if(bytes.readUInt32LE(end)!==0x06054b50) continue;
    let offset=bytes.readUInt32LE(end+16);
    const entries=new Set<string>();
    while(offset+46<=end && bytes.readUInt32LE(offset)===0x02014b50) {
      const length=bytes.readUInt16LE(offset+28);
      entries.add(bytes.toString("utf8",offset+46,offset+46+length));
      offset+=46+length+bytes.readUInt16LE(offset+30)+bytes.readUInt16LE(offset+32);
    }
    return entries.has("[Content_Types].xml") && entries.has(entry);
  }
  return false;
}
export async function inspectFile(file:File) {
  const ext=file.name.toLowerCase().split(".").pop()||"";
  const mime=types[ext];
  if(!mime || file.size<1 || file.size>10*1024*1024 || (file.type && file.type!==mime))
    throw Error("Use PDF, DOCX, XLSX, PNG ou JPG de até 10 MiB.");
  const bytes=Buffer.from(await file.arrayBuffer());
  const valid=ext==="pdf"?bytes.toString("ascii",0,5)==="%PDF-":
    ext==="png"?bytes.subarray(0,8).toString("hex")==="89504e470d0a1a0a":
    mime==="image/jpeg"?bytes.subarray(0,3).toString("hex")==="ffd8ff":
    officePackage(bytes,ext==="docx"?"word/document.xml":"xl/workbook.xml");
  if(!valid) throw Error("O conteúdo do arquivo não corresponde à extensão.");
  return {bytes,mime};
}
