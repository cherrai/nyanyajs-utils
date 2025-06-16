export type TimeFormatEmum = '24-hour' | '12-hour'

export const covertTimeFormat = (timeFormat: TimeFormatEmum, lang: string) => {
  if (timeFormat === '24-hour') {
    return {
      h: 'HH:00',
      hm: 'HH:mm',
      hms: 'HH:mm:ss',
    }
  }

  if (lang === 'zh-CN' || lang == 'zh-TW') {
    return {
      h: 'Ah:00',
      hm: 'Ah:mm',
      hms: 'Ah:mm:ss',
    }
  }
  return {
    h: 'h:00 A',
    hm: 'h:mm A',
    hms: 'h:mm:ss A',
  }
}

export const time = { covertTimeFormat }

export default time
