/* hgit.js — auto-follow channel/saluran untuk semua bot yang terhubung */

// Daftar channel yang akan di-follow otomatis oleh SEMUA bot
// Format: 'xxxxxxxxxxxx@newsletter'
export const hgitChannels = [
    // Ganti dengan JID channel kamu
    // '120363xxxxxxxx@newsletter',
]

// Flag global — bisa di-override per-bot lewat config
export const hgitEnabled = true

// Delay antar follow (ms) biar gak kena rate-limit
export const hgitDelayMs = 2000

// Delay sebelum mulai follow setelah connect (ms) — biar koneksi stabil dulu
export const hgitStartDelayMs = 3000

/**
 * Normalisasi input channel — bisa string atau object
 */
const hgitNormalize = (channels) => {
    return channels.map(ch => {
        if (typeof ch === 'string') return { jid: ch, name: ch }
        return { jid: ch.jid, name: ch.name || ch.jid }
    }).filter(ch => ch.jid && ch.jid.endsWith('@newsletter'))
}

/**
 * Cek error "sudah follow"
 */
const hgitIsAlreadyFollowed = (err) => {
    const code = err?.output?.statusCode
    const msg = (err?.message || '').toLowerCase()
    return code === 409
        || msg.includes('already')
        || msg.includes('subscribed')
        || msg.includes('conflict')
}

/**
 * hgit — auto-follow semua channel. Idempotent — aman dipanggil berkali-kali.
 * @param {object} sock - instance socket yang sudah jadi
 * @param {object} options
 * @param {string[]} options.channels - daftar channel (opsional, default dari env)
 * @param {object} options.logger
 */
export async function hgitRun(sock, options = {}) {
    const logger = options.logger || console
    const channels = hgitNormalize(
        options.channels
        || process.env.HGIT_CHANNELS?.split(',').map(s => s.trim()).filter(Boolean)
        || hgitChannels
    )

    if (!channels.length) {
        logger.debug?.('hgit: tidak ada channel yang dikonfigurasi, skip')
        return
    }

    logger.info?.({ count: channels.length }, 'hgit: memulai follow channel')

    for (const { jid, name } of channels) {
        try {
            await sock.newsletterFollow(jid)
            logger.info?.({ jid, name }, 'hgit: berhasil follow channel')
        } catch (err) {
            if (hgitIsAlreadyFollowed(err)) {
                logger.debug?.({ jid, name }, 'hgit: sudah follow channel')
            } else {
                logger.warn?.({ jid, name, err: err?.message }, 'hgit: gagal follow channel')
            }
        }
        // delay antar follow
        await new Promise(r => setTimeout(r, hgitDelayMs))
    }

    logger.info?.('hgit: selesai')
}