import { StyleSheet } from 'react-native';
import * as defaultStyle from '../style';
import platformStyles from './platform-style';

const STYLESHEET_ID = 'stylesheet.agenda.main';

export default function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  const { knob, weekdays } = platformStyles(appStyle);
  return StyleSheet.create({
    knob,
    weekdays,
    calendar: {
      flex: 1,
      borderBottomWidth: 1,
      borderColor: appStyle.separatorColor,
    },
    weekday: {
      width: 32,
      textAlign: 'center',
      fontSize: 13,
      color: appStyle.textSectionTitleColor,
    },
    reservations: {
      flex: 1,
      backgroundColor: appStyle.backgroundColor,
    },
    header: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 56,
      borderBottomColor: '#ACACAC',
      borderBottomWidth: 1,
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}
