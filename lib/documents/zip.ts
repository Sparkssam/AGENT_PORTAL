function zipSig(...bytes: number[]) {
  return Buffer.from(bytes)
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let bit = 0; bit < 8; bit++) {
      const take = crc & 1
      crc >>>= 1
      if (take) crc ^= 0xedb88320
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosTime(date = new Date()) {
  const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, day }
}

function u16(value: number) {
  const buf = Buffer.alloc(2)
  buf.writeUInt16LE(value >>> 0, 0)
  return buf
}

function u32(value: number) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32LE(value >>> 0, 0)
  return buf
}

/** ZIP archive using store (no compression). Filenames must be ASCII-safe. */
export function zipStoredFiles(files: Array<{ name: string; data: Uint8Array }>) {
  const { time, day } = dosTime()
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  const used = new Map<string, number>()
  for (const file of files) {
    const base = file.name.replace(/\\/g, "/").replace(/^\/+/, "") || "file.bin"
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)
    const name = count === 1 ? base : base.replace(/(\.[^.]+)?$/, `-${count}$1`)
    const nameBuf = Buffer.from(name, "utf8")
    const data = Buffer.from(file.data)
    const crc = crc32(data)

    const local = Buffer.concat([
      zipSig(0x50, 0x4b, 0x03, 0x04),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(time),
      u16(day),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ])
    locals.push(local)

    const central = Buffer.concat([
      zipSig(0x50, 0x4b, 0x01, 0x02),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(time),
      u16(day),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBuf,
    ])
    centrals.push(central)
    offset += local.length
  }

  const centralDir = Buffer.concat(centrals)
  const end = Buffer.concat([
    zipSig(0x50, 0x4b, 0x05, 0x06),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])

  return Buffer.concat([...locals, centralDir, end])
}
