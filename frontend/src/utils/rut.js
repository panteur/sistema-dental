export function formatRut(value) {
  if (!value) return ''
  const cleaned = value.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 2) return cleaned.toUpperCase()
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

export function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return false
  const cleaned = rut.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 2) return false
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()

  if (!/^\d+$/.test(body)) return false
  if (!/^\d|K$/.test(dv)) return false

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = sum % 11
  const expectedDV = remainder === 0 ? '0' : String(11 - remainder)
  return dv === expectedDV
}

export function cleanRut(rut) {
  if (!rut) return ''
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function formatPhone(value) {
  if (!value) return ''
  const cleaned = value.replace(/[^0-9]/g, '')
  if (!cleaned) return ''
  if (cleaned.length <= 9) {
    if (cleaned.length <= 4) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
    return `9 ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`
  }
  const num = cleaned.slice(-9)
  return `9 ${num.slice(1, 5)} ${num.slice(5)}`
}

export function cleanPhone(value) {
  if (!value) return ''
  return value.replace(/[^0-9]/g, '').slice(-9)
}

export function formatPhoneForDB(value) {
  const cleaned = cleanPhone(value)
  return `+56 ${cleaned}`
}
