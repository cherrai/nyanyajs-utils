export type TemperatureEnum = '°C' | '°F'

export const convertTemperature = (
  value: number,
  fromUnit: TemperatureEnum,
  toUnit: TemperatureEnum
) => {
  if (fromUnit === toUnit) {
    return Number(value.toFixed(2))
  }
  let val = 0
  // 将输入转换为摄氏度
  if (fromUnit === '°C') {
    val = value
  } else {
    val = ((value - 32) * 5) / 9 // °F to °C
  }

  // 将摄氏度转换为目标单位
  if (toUnit === '°C') {
    return Number(val.toFixed(1))
  } else {
    return Number(((val * 9) / 5 + 32).toFixed(1)) // °C to °F
  }
}

export type PrecipitationEnum = 'mm' | 'cm' | 'in'

export const convertPrecipitation = (
  value: number,
  fromUnit: PrecipitationEnum,
  toUnit: PrecipitationEnum
): number => {
  // 优化：如果输入和输出单位相同，直接返回原值
  if (fromUnit === toUnit) {
    return Number(value.toFixed(2))
  }

  let millimeters: number

  // 将输入转换为毫米 (mm)
  if (fromUnit === 'mm') {
    millimeters = value
  } else if (fromUnit === 'cm') {
    millimeters = value * 10 // 1 cm = 10 mm
  } else {
    millimeters = value * 25.4 // 1 in = 25.4 mm
  }

  // 将毫米转换为目标单位
  if (toUnit === 'mm') {
    return Number(millimeters.toFixed(1))
  } else if (toUnit === 'cm') {
    return Number((millimeters / 10).toFixed(2)) // mm to cm
  } else {
    return Number((millimeters / 25.4).toFixed(2)) // mm to in
  }
}

export type WindSpeedEnum = 'km/h' | 'm/s' | 'mph' | 'kt' | 'Beaufort'

export const convertWindSpeed = (
  value: number,
  fromUnit: WindSpeedEnum,
  toUnit: WindSpeedEnum
): number => {
  // 优化：如果输入和输出单位相同，直接返回原值
  if (fromUnit === toUnit) {
    return Number(value.toFixed(2))
  }

  let metersPerSecond: number

  // 将输入转换为米每秒 (m/s)
  if (fromUnit === 'm/s') {
    metersPerSecond = value
  } else if (fromUnit === 'km/h') {
    metersPerSecond = value / 3.6 // 1 km/h = 0.277778 m/s
  } else if (fromUnit === 'mph') {
    metersPerSecond = value * 0.44704 // 1 mph = 0.44704 m/s
  } else if (fromUnit === 'kt') {
    metersPerSecond = value * 0.514444 // 1 kt = 0.514444 m/s
  } else {
    // Beaufort 近似转换：m/s = 0.836 * (Beaufort)^(3/2)
    metersPerSecond = 0.836 * Math.pow(value, 1.5)
  }

  // 将米每秒转换为目标单位
  if (toUnit === 'm/s') {
    return Number(metersPerSecond.toFixed(1))
  } else if (toUnit === 'km/h') {
    return Number((metersPerSecond * 3.6).toFixed(1)) // m/s to km/h
  } else if (toUnit === 'mph') {
    return Number((metersPerSecond / 0.44704).toFixed(1)) // m/s to mph
  } else if (toUnit === 'kt') {
    return Number((metersPerSecond / 0.514444).toFixed(1)) // m/s to kt
  } else {
    // Beaufort 近似反算：Beaufort = (m/s / 0.836)^(2/3)
    return Math.round(Math.pow(metersPerSecond / 0.836, 2 / 3))
  }
}

export type PressureEnum =
  | 'hPa'
  | 'kPa'
  | 'mmHg'
  | 'inHg'
  | 'mbar'
  | 'bar'
  | 'psi'

export const convertPressure = (
  value: number,
  fromUnit: PressureEnum,
  toUnit: PressureEnum
): number => {
  // 优化：如果输入和输出单位相同，直接返回原值
  if (fromUnit === toUnit) {
    return Number(value.toFixed(2))
  }

  let hectoPascals: number

  // 将输入转换为百帕 (hPa)
  if (fromUnit === 'hPa') {
    hectoPascals = value
  } else if (fromUnit === 'kPa') {
    hectoPascals = value * 10 // 1 kPa = 10 hPa
  } else if (fromUnit === 'mmHg') {
    hectoPascals = value * 1.33322 // 1 mmHg = 1.33322 hPa
  } else if (fromUnit === 'inHg') {
    hectoPascals = value * 33.8639 // 1 inHg = 33.8639 hPa
  } else if (fromUnit === 'mbar') {
    hectoPascals = value // 1 mbar = 1 hPa
  } else if (fromUnit === 'bar') {
    hectoPascals = value * 1000 // 1 bar = 1000 hPa
  } else {
    hectoPascals = value * 68.9476 // 1 psi = 68.9476 hPa
  }

  // 将百帕转换为目标单位
  if (toUnit === 'hPa') {
    return Number(hectoPascals.toFixed(2))
  } else if (toUnit === 'kPa') {
    return Number((hectoPascals / 10).toFixed(3)) // hPa to kPa
  } else if (toUnit === 'mmHg') {
    return Number((hectoPascals / 1.33322).toFixed(2)) // hPa to mmHg
  } else if (toUnit === 'inHg') {
    return Number((hectoPascals / 33.8639).toFixed(2)) // hPa to inHg
  } else if (toUnit === 'mbar') {
    return Number(hectoPascals.toFixed(2)) // hPa to mbar
  } else if (toUnit === 'bar') {
    return Number((hectoPascals / 1000).toFixed(3)) // hPa to bar
  } else {
    return Number((hectoPascals / 68.9476).toFixed(2)) // hPa to psi
  }
}

export type VisibilityEnum = 'km' | 'mile' | 'm'

export const convertVisibility = (
  value: number,
  fromUnit: VisibilityEnum,
  toUnit: VisibilityEnum
): number => {
  // 优化：如果输入和输出单位相同，直接返回原值
  if (fromUnit === toUnit) {
    return Number(value.toFixed(2))
  }

  let kilometers: number

  // 将输入转换为公里 (km)
  if (fromUnit === 'km') {
    kilometers = value
  } else if (fromUnit === 'mile') {
    kilometers = value * 1.60934 // 1 mile = 1.60934 km
  } else {
    kilometers = value / 1000 // 1 m = 0.001 km
  }

  // 将公里转换为目标单位
  if (toUnit === 'km') {
    return Number(kilometers.toFixed(2))
  } else if (toUnit === 'mile') {
    return Number((kilometers / 1.60934).toFixed(2)) // km to mile
  } else {
    return Number((kilometers * 1000).toFixed(0)) // km to m
  }
}

export const weather = {
  convertTemperature,
  convertPrecipitation,
  convertWindSpeed,
  convertPressure,
  convertVisibility,
}

export default weather
