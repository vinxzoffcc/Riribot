import axios from 'axios'
import fs from 'fs'
import crypto from 'crypto'
let renz = async (m, { conn, args }) => {
const jowo = {
  api: {
    base: 'https://us-drama-api.pixtv.cc',
    endpoints: {
      init: '/Android/Users/init',
      list: '/Android/VideoCenter/getVideoList',
      drama: '/Android/VideoCenter/getVideoDrama',
      getUserInfo: '/Android/Users/getUserInfo'
    }
  },
  blockMap: { selected: 1, hot: 5, new: 6, male: 7, female: 8, original: 9 },
  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept-encoding': 'gzip',
    'content-type': 'application/json'
  },
  userCache: null,
  deviceCache: null,
  cachePath: './user.json',

  saveCache: function () {
    const data = {
      token: this.userCache?.token,
      headers: this.userCache?.headers,
      info: this.userCache?.info,
      device: this.deviceCache
    }
    fs.writeFileSync(this.cachePath, JSON.stringify(data))
  },

  loadCache: function () {
    if (!fs.existsSync(this.cachePath)) return null
    try {
      const data = JSON.parse(fs.readFileSync(this.cachePath))
      this.userCache = { token: data.token, headers: data.headers, info: data.info }
      this.deviceCache = data.device
      return true
    } catch { return false }
  },

  generateDevice: () => {
    const brands = {
      Oppo: ['CPH2699','CPH2739','CPH2735'],
      Xiaomi: ['2407FPN8EG','24116RNC1I','25057RN09E'],
      Samsung: ['SM-A566V','SM-A176B','SM-E366B'],
      Realme: ['RMX3562','RMX3286','RMX3286']
    }
    const versions = ['12','13','14']
    const brand = Object.keys(brands)[Math.floor(Math.random()*4)]
    const model = brands[brand][Math.floor(Math.random()*brands[brand].length)]
    const version = versions[Math.floor(Math.random()*versions.length)]
    return {
      aid: [...Array(16)].map(()=>Math.random().toString(36)[2]).join(''),
      gaid: crypto.randomUUID(),
      systemversion: `${brand}|${model}|${version}`
    }
  },

  init: async () => {
    if (jowo.userCache) return jowo.userCache
    const loaded = jowo.loadCache()
    if (loaded) {
      const headers = { ...jowo.userCache.headers, token: jowo.userCache.token, ts: Math.floor(Date.now()/1000).toString() }
      try {
        const { data } = await axios.post(`${jowo.api.base}${jowo.api.endpoints.getUserInfo}`, {}, { headers })
        jowo.userCache.info = data.data
        return jowo.userCache
      } catch {
        jowo.userCache = null
        jowo.deviceCache = null
      }
    }
    jowo.deviceCache = jowo.generateDevice()
    const headers = { ...jowo.headers, aid: jowo.deviceCache.aid, gaid: jowo.deviceCache.gaid,
      adjustgaid:'', channel:'google', source:'android',
      version:'1.0.45', vcode:'60', language:'en',
      ts: Math.floor(Date.now()/1000).toString(),
      systemversion: jowo.deviceCache.systemversion
    }
    try {
      const { data } = await axios.post(`${jowo.api.base}${jowo.api.endpoints.init}`, { aid: jowo.deviceCache.aid }, { headers })
      const token = data.data.token
      const i = await jowo.getUserInfo({ token, headers })
      jowo.userCache = { token, headers, info: i.result }
      jowo.saveCache()
      return jowo.userCache
    } catch (err) {
      return { success:false, code:err?.response?.status||500, result:{ error:'Error bree 🗿' } }
    }
  },

  getUserInfo: async ({ token, headers } = {}) => {
    const user = token && headers ? { token, headers } : await jowo.init()
    if (!user.token) return user
    const head = { ...user.headers, token:user.token, ts:Math.floor(Date.now()/1000).toString() }
    try {
      const { data } = await axios.post(`${jowo.api.base}${jowo.api.endpoints.getUserInfo}`, {}, { headers: head })
      return { success:true, code:200, result:data.data }
    } catch (err) {
      if (err?.response?.status===401) {
        jowo.userCache = null
        return await jowo.getUserInfo()
      }
      return { success:false, code:err?.response?.status||500, result:{ error:'Error bree 🗿' } }
    }
  },

  list: async ({ category, blockId, vid, page=1, pageSize=5 }) => {
    const resBlockId = blockId || jowo.blockMap[category]
    if (!resBlockId) return { success:false, code:400, result:{ error:'Kategori kagak valid 🙃' } }
    const user = await jowo.init()
    if (!user.token) return user
    const headers = { ...user.headers, token:user.token, ts:Math.floor(Date.now()/1000).toString() }
    const payload = { blockId:resBlockId.toString(), page:page.toString(), pageSize:pageSize.toString(), vid: vid?.toString()||'' }
    try {
      const { data } = await axios.post(`${jowo.api.base}${jowo.api.endpoints.list}`, payload, { headers })
      const videos = data.data.list||[]
      return { success:true, code:200, result:{
        mode: vid?'season':'category', category:category||null, blockId:resBlockId,
        page,pageSize,total:videos.length,
        videos:videos.map(v=>({ title:v.name, vid:v.vid, thumb:v.thumb, isFree:v.is_free, episodeCount:v.publishCount }))
      }}
    } catch (err) {
      if (err?.response?.status===401) { jowo.userCache=null; return await jowo.list({category,blockId,vid,page,pageSize}) }
      return { success:false, code:err?.response?.status||500, result:{ error:'Error bree 🗿' } }
    }
  },

  drama: async (vid='') => {
    if (!vid) return { success:false, code:400, result:{ error:'Id videonya kagak valid bree' } }
    const user = await jowo.init()
    if (!user.token) return user
    const headers = { ...user.headers, token:user.token, ts:Math.floor(Date.now()/1000).toString() }
    try {
      const { data } = await axios.post(`${jowo.api.base}${jowo.api.endpoints.drama}`, { vid }, { headers })
      const episodes = data.data.list||[]
      return { success:true, code:200, result:{
        vid,totalEpisodes:episodes.length,
        episodes:episodes.map(ep=>({ id:ep.id, dramaNum:ep.dramaNum, playUrl:ep.playUrl, thumb:ep.thumb, price:ep.price, unlock:ep.unlock, subtitlesUrl:ep.subtitlesUrl||null }))
      }}
    } catch (err) {
      if (err?.response?.status===401) { jowo.userCache=null; return await jowo.drama(vid) }
      return { success:false, code:err?.response?.status||500, result:{ error:'Error bree 🗿' } }
    }
  }
}

try {
  let q = args[0]
  if (!q) return m.reply(`⚠️ Format:\n.jowotv list hot\n.jowotv drama <vid>\n.jowotv info`)

  if (q === 'list') {
    let cat = args[1]||'hot'
    let res = await jowo.list({ category: cat })
    if (!res.success) return m.reply(res.result.error)
    let teks = `📺 *Daftar Video* (${cat})\n\n`
    for (let v of res.result.videos) {
      teks += `🎬 ${v.title}\nVID: ${v.vid}\nEpisode: ${v.episodeCount}\n\n`
      await conn.sendMessage(m.chat, { image:{ url:v.thumb }, caption:`🎬 ${v.title}\nVID: ${v.vid}` })
    }
    m.reply(teks)
  }

  if (q === 'drama') {
    let vid = args[1]
    if (!vid) return m.reply('⚠️ Masukkan VID dramanya!')
    let res = await jowo.drama(vid)
    if (!res.success) return m.reply(res.result.error)
    let teks = `🎞️ *Episode dari VID ${vid}*\nTotal: ${res.result.totalEpisodes}\n\n`
    for (let ep of res.result.episodes.slice(0,3)) {
      teks += `Eps ${ep.dramaNum} - ${ep.playUrl}\n`
      await conn.sendMessage(m.chat, { video:{ url: ep.playUrl }, caption:`Eps ${ep.dramaNum}` })
    }
    m.reply(teks)
  }

  if (q === 'info') {
    let res = await jowo.getUserInfo()
    if (!res.success) return m.reply(res.result.error)
    m.reply(`👤 *User Info*\n\n${JSON.stringify(res.result,null,2)}`)
  }

} catch (e) {
  m.reply('❌ Error bree: '+ e.message)
  }
}
renz.command = /^(jowotv|jowo)$/i;
renz.help = ["jowotv", "jowo"];
renz.tags = ["internet"];
renz.limit = true;

export default renz;