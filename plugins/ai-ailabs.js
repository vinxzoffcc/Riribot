import axios from 'axios'
import chalk from 'chalk'
import FormData from 'form-data'

let renz = async (m, { conn, text }) => {
    const aiLabs = {
        api: {
            base: 'https://text2video.aritek.app',
            endpoints: {
                text2img: '/text2img',
                generate: '/txt2videov3',
                video: '/video'
            }
        },
        headers: {
            'user-agent': 'NB Android/1.0.0',
            'accept-encoding': 'gzip',
            'content-type': 'application/json',
            authorization: ''
        },
        state: { token: null },
        setup: {
            cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
            shiftValue: 3,
            dec(text, shift) {
                return [...text].map(c =>
                    /[a-z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
                        : /[A-Z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
                        : c
                ).join('')
            },
            decrypt: async () => {
                if (aiLabs.state.token) return aiLabs.state.token
                const input = aiLabs.setup.cipher
                const shift = aiLabs.setup.shiftValue
                const decrypted = aiLabs.setup.dec(input, shift)
                aiLabs.state.token = decrypted
                aiLabs.headers.authorization = decrypted
                return decrypted
            }
        },
        deviceId() {
            return Array.from({ length: 16 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('')
        },
        text2img: async (prompt) => {
            if (!prompt?.trim()) {
                return { success: false, code: 400, result: { error: '⚠️ Input kosong bree 🗿' } }
            }
            const token = await aiLabs.setup.decrypt()
            const form = new FormData()
            form.append('prompt', prompt)
            form.append('token', token)
            try {
                const url = aiLabs.api.base + aiLabs.api.endpoints.text2img
                const res = await axios.post(url, form, { headers: { ...aiLabs.headers, ...form.getHeaders() } })
                const { code, url: imageUrl } = res.data
                if (code !== 0 || !imageUrl) {
                    return { success: false, code: res.status, result: { error: '❌ Gagal generate image bree 😂' } }
                }
                return { success: true, code: res.status, result: { url: imageUrl.trim(), prompt } }
            } catch (err) {
                return { success: false, code: err.response?.status || 500, result: { error: err.message || 'Error bree 😂' } }
            }
        },
        generate: async ({ prompt = '', type = 'video', isPremium = 1 } = {}) => {
            if (!prompt?.trim()) return { success: false, code: 400, result: { error: '⚠️ Prompt kosong bree 😂' } }
            if (!/^(image|video)$/.test(type)) return { success: false, code: 400, result: { error: '⚠️ Tipe cuma bisa "image" atau "video" bree 😂' } }
            if (type === 'image') return await aiLabs.text2img(prompt)
            await aiLabs.setup.decrypt()
            const payload = { deviceID: aiLabs.deviceId(), isPremium, prompt, used: [], versionCode: 59 }
            try {
                const url = aiLabs.api.base + aiLabs.api.endpoints.generate
                const res = await axios.post(url, payload, { headers: aiLabs.headers })
                const { code, key } = res.data
                if (code !== 0 || !key) {
                    return { success: false, code: res.status, result: { error: '❌ Gagal ambil Key bree 😂' } }
                }
                return await aiLabs.video(key)
            } catch (err) {
                return { success: false, code: err.response?.status || 500, result: { error: err.message || 'Error bree 😂' } }
            }
        },
        video: async (key) => {
            if (!key || typeof key !== 'string') {
                return { success: false, code: 400, result: { error: '❌ Key invalid bree 😂' } }
            }
            await aiLabs.setup.decrypt()
            const payload = { keys: [key] }
            const url = aiLabs.api.base + aiLabs.api.endpoints.video
            const maxAttempts = 40, delay = 2000
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    const res = await axios.post(url, payload, { headers: aiLabs.headers })
                    const { code, datas } = res.data
                    if (code === 0 && datas?.[0]?.url) {
                        return { success: true, code: res.status, result: { url: datas[0].url.trim(), key: datas[0].key } }
                    }
                    await new Promise(r => setTimeout(r, delay))
                } catch {
                    await new Promise(r => setTimeout(r, delay))
                }
            }
            return { success: false, code: 504, result: { error: '⏳ Timeout bree 😂' } }
        }
    }

    if (!text) return m.reply('⚠️ Masukkan prompt!\nContoh: .ailabs image kucing imut')

    let [type, ...query] = text.split(' ')
    if (!['image', 'video'].includes(type)) {
        query = [type, ...query]
        type = 'video'
    }
    const prompt = query.join(' ')
    m.reply('⏳ Lagi diproses bree...')

    let result = await aiLabs.generate({ prompt, type })
    if (!result.success) return m.reply(`❌ Gagal: ${result.result.error}`)

    if (type === 'image') {
        await conn.sendMessage(m.chat, {
            image: { url: result.result.url },
            caption: `✅ Hasil generate dari prompt:\n${prompt}`
        })
    } else {
        await conn.sendMessage(m.chat, {
            video: { url: result.result.url },
            caption: `✅ Hasil generate dari prompt:\n${prompt}`,
            ptv: false
        })
    }
}
renz.command = /^(ailabs)$/i;
renz.help = ["ailabs"];
renz.tags = ["ai"];
renz.limit = true;
renz.regis = true;
export default renz;