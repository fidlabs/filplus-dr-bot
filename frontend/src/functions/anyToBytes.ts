// import ByteConverter from '@wtfcode/byte-converter'


// export function anyToBytes(inputDatacap: string) {
//   const byteConverter = new ByteConverter()
//   const formatDc = inputDatacap.replace(/[\s]/g, "").replace(/[t]/g, "T").replace(/[b]/g, "B").replace(/[p]/g, "P").replace(/[I]/g, "i").replace(/\s*/g, "")
//   const ext = formatDc.replace(/[0-9.]/g, '')
//   const datacap = formatDc.replace(/[^0-9.]/g, '')
//   const bytes = Number(byteConverter.convert(parseFloat(datacap), ext, 'B').toFixed())
//   return bytes
// }