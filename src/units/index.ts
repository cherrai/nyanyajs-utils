import { covertTimeFormat } from './time'
import {
  convertTemperature,
  convertPrecipitation,
  convertWindSpeed,
  convertPressure,
  convertVisibility,
} from './weather'

export const units = {
  weather: {
    convertTemperature,
    convertPrecipitation,
    convertWindSpeed,
    convertPressure,
    convertVisibility,
  },
  time: { covertTimeFormat },
}

export default units
