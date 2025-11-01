import axios from 'axios'
let renz = async (m, { conn, text }) => {
    const artly = {
        api: {
            base: 'https://getimg-x4mrsuupda-uc.a.run.app',
            endpoint: {
                generate: '/api-premium',
                transform: '/image-to-image'
            }
        },
        headers: {
            'user-agent': 'NB Android/1.0.0',
            'accept-encoding': 'gzip',
            'content-type': 'application/x-www-form-urlencoded'
        },
        generate: async (prompt = '', width = 512, height = 512, steps = 25) => {
            if (!prompt.trim()) return { success: false, result: { error: 'Prompt kosong bree 🗿' } }
            try {
                const payload = new URLSearchParams()
                payload.append('prompt', prompt)
                payload.append('width', width.toString())
                payload.append('height', height.toString())
                payload.append('num_inference_steps', steps.toString())

                const res = await axios.post(`${artly.api.base}${artly.api.endpoint.generate}`, payload, { headers: artly.headers })
                return { success: true, result: { seed: res.data.seed, cost: res.data.cost, url: res.data.url } }
            } catch {
                return { success: false, result: { error: 'Error bree 🗿' } }
            }
        },
        transform: async (image_url = '', prompt = '') => {
            if (!image_url.trim()) return { success: false, result: { error: 'Link imagenya mana bree?' } }
            if (!prompt.trim()) return { success: false, result: { error: 'Prompt kosong bree 🗿' } }
            try {
                const payload = new URLSearchParams()
                payload.append('image_url', image_url)
                payload.append('prompt', prompt)

                const res = await axios.post(`${artly.api.base}${artly.api.endpoint.transform}`, payload, { headers: artly.headers })
                return { success: true, result: { seed: res.data.image.seed, cost: res.data.image.cost, url: res.data.image.url } }
            } catch {
                return { success: false, result: { error: 'Error bree 🗿' } }
            }
        }
    }

    if (!text) return m.reply(`Contoh:\n.artly generate kucing lucu\n.artly transform https://xxx.com/cat.jpg | jadi anime`)

    let [cmd, ...rest] = text.split(" ")
    cmd = cmd.toLowerCase()

    if (cmd === 'generate') {
        let prompt = rest.join(" ")
        let hasil = await artly.generate(prompt)
        if (!hasil.success) return m.reply(hasil.result.error)

        conn.sendMessage(m.chat, {
            image: { url: hasil.result.url },
            caption: `Prompt: ${prompt}\nSeed: ${hasil.result.seed}\nCost: ${hasil.result.cost}`
        })
    }

    if (cmd === 'transform') {
        let [link, ...pr] = rest.join(" ").split("|")
        if (!link || !pr.length) return m.reply(`Format salah!\n.artly transform <link> | <prompt>`)

        let prompt = pr.join(" ").trim()
        let hasil = await artly.transform(link.trim(), prompt)
        if (!hasil.success) return m.reply(hasil.result.error)

        conn.sendMessage(m.chat, {
            image: { url: hasil.result.url },
            caption: `Prompt: ${prompt}\nSeed: ${hasil.result.seed}\nCost: ${hasil.result.cost}`
        })
    }    
}
renz.command = /^(artly|art)$/i;
renz.help = ["artly", "art"];
renz.tags = ["ai"];
renz.limit = true;
renz.regis = true;

export default renz;